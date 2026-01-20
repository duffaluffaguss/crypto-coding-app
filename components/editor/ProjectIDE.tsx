'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TutorChat } from '@/components/chat/TutorChat';
import { LessonSidebar } from '@/components/lessons/LessonSidebar';
import { DeployButton } from '@/components/wallet/DeployButton';
import { ContractInteraction } from '@/components/wallet/ContractInteraction';
import { FrontendGenerator } from '@/components/wallet/FrontendGenerator';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ExportButton } from '@/components/editor/ExportButton';
import { ShareToShowcase } from '@/components/showcase/ShareToShowcase';
import { OnboardingTour, useTour } from '@/components/tour/OnboardingTour';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Project, ProjectFile, Lesson, LearningProgress, CompilationResult } from '@/types';

// Mobile tab type
type MobileTab = 'code' | 'lessons' | 'chat';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  ),
});

interface ProjectIDEProps {
  project: Project;
  initialFiles: ProjectFile[];
  lessons: Lesson[];
  progress: LearningProgress[];
}

export function ProjectIDE({ project, initialFiles, lessons, progress }: ProjectIDEProps) {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [code, setCode] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [deployedContract, setDeployedContract] = useState<string | null>(project.contract_address);
  const [contractAbi, setContractAbi] = useState<any[] | null>(project.contract_abi);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('code');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [isProjectPublic, setIsProjectPublic] = useState(project.is_public || false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const { showTour, startTour, endTour } = useTour();

  // Format code with Prettier
  const formatCode = useCallback(async () => {
    if (!code.trim()) return;
    
    setFormatting(true);
    try {
      const response = await fetch('/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      
      if (response.ok && result.formatted) {
        setCode(result.formatted);
        setSaveStatus('unsaved'); // Mark as unsaved since code changed
      } else {
        console.error('Format error:', result.error);
      }
    } catch (error) {
      console.error('Failed to format:', error);
    } finally {
      setFormatting(false);
    }
  }, [code]);

  // Auto-save functionality - saves 2 seconds after user stops typing
  const autoSave = useCallback(async () => {
    if (!activeFile || saveStatus === 'saving') return;
    
    setSaveStatus('saving');
    try {
      await supabase
        .from('project_files')
        .update({ content: code })
        .eq('id', activeFile.id);

      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, content: code } : f))
      );
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  }, [activeFile, code, saveStatus, supabase]);

  // Trigger auto-save when code changes
  useEffect(() => {
    if (!activeFile) return;
    
    // Mark as unsaved when code differs from saved version
    const savedContent = files.find(f => f.id === activeFile.id)?.content;
    if (code !== savedContent) {
      setSaveStatus('unsaved');
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (2 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      if (code !== savedContent) {
        autoSave();
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [code, activeFile, files, autoSave]);

  // Initialize with template if no files exist
  useEffect(() => {
    const initializeProject = async () => {
      if (initialFiles.length === 0) {
        const template = getTemplateForProjectType(project.project_type, project.name);
        const filename = `${project.name.replace(/\s+/g, '')}.sol`;

        const { data: newFile } = await supabase
          .from('project_files')
          .insert({
            project_id: project.id,
            filename,
            content: template,
            file_type: 'solidity',
            is_template: true,
          })
          .select()
          .single();

        if (newFile) {
          setFiles([newFile]);
          setActiveFile(newFile);
          setCode(template);
        }
      } else {
        setActiveFile(initialFiles[0]);
        setCode(initialFiles[0].content);
      }

      // Set first available lesson
      if (lessons.length > 0) {
        setCurrentLesson(lessons[0]);
      }
    };

    initializeProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createInitialFile = async () => {
    const template = getTemplateForProjectType(project.project_type, project.name);
    const filename = `${project.name.replace(/\s+/g, '')}.sol`;

    const { data: newFile } = await supabase
      .from('project_files')
      .insert({
        project_id: project.id,
        filename,
        content: template,
        file_type: 'solidity',
        is_template: true,
      })
      .select()
      .single();

    if (newFile) {
      setFiles([newFile]);
      setActiveFile(newFile);
      setCode(template);
    }
  };

  const getTemplateForProjectType = (type: string, name: string): string => {
    const contractName = name.replace(/\s+/g, '');

    switch (type) {
      case 'nft_marketplace':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Welcome to your NFT Marketplace!
    // Follow the lessons on the right to build it step by step.

    string public name = "${name}";
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // TODO: Add your marketplace logic here
    // Lesson 1: Add state variables for items
    // Lesson 2: Create a struct for market items
    // Lesson 3: Add listing functionality
}`;

      case 'token':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Your custom ERC-20 token!

    string public name = "${name}";
    string public symbol = "${contractName.substring(0, 4).toUpperCase()}";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
    }

    // TODO: Add transfer functionality
}`;

      case 'dao':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Your Decentralized Autonomous Organization!

    string public name = "${name}";
    uint256 public memberCount;

    mapping(address => bool) public isMember;

    constructor() {
        isMember[msg.sender] = true;
        memberCount = 1;
    }

    // TODO: Add membership and voting functionality
}`;

      case 'game':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Your Blockchain Lottery Game!
    // Players can enter by paying a fee, and one lucky winner takes the prize pool!

    string public name = "${name}";
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // TODO: Follow the lessons to build your lottery game!
    // Lesson 1: Add entry fee and player tracking
    // Lesson 2: Track the prize pool
    // Lesson 3: Pick a winner and send the prize
}`;

      case 'social':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Your Decentralized Social Platform!
    // Users can create profiles, post content, follow others, and tip creators!

    string public platformName = "${name}";
    address public owner;
    uint256 public userCount;

    constructor() {
        owner = msg.sender;
    }

    // TODO: Follow the lessons to build your social platform!
    // Lesson 1: Create user profiles with usernames
    // Lesson 2: Add posting functionality
    // Lesson 3: Implement likes and tipping
}`;

      case 'creator':
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Your Creator Contract - like Bandcamp/Etsy/Gumroad but YOU own it!
// No platform fees, no algorithm changes, no account bans
// Perfect for: artists, musicians, photographers, designers, makers

contract ${contractName} {
    string public creatorName = "${name}";
    address public creator;

    constructor() {
        creator = msg.sender;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only the creator can do this");
        _;
    }

    // TODO: Follow the lessons to build your creator platform!
    // Lesson 1: Mint your creative works (art, music, photos)
    // Lesson 2: Sell directly to fans - no middleman!
    // Lesson 3: Earn royalties on every resale - forever!
    // Lesson 4: Split payments with collaborators/bandmates
}`;

      default:
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${contractName} {
    // Your Web3 project starts here!

    string public name = "${name}";
    address public owner;

    constructor() {
        owner = msg.sender;
    }
}`;
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      setCompilationResult(null);
    }
  };

  const saveFile = useCallback(async () => {
    if (!activeFile) return;

    await supabase
      .from('project_files')
      .update({ content: code })
      .eq('id', activeFile.id);

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: code } : f))
    );
  }, [activeFile, code, supabase]);

  const compileCode = useCallback(async () => {
    setCompiling(true);
    setCompilationResult(null);

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: code,
          contractName: activeFile?.filename.replace('.sol', ''),
        }),
      });

      const result = await response.json();
      setCompilationResult(result);

      if (result.success) {
        // Save the file after successful compilation
        await saveFile();
      }
    } catch (error) {
      setCompilationResult({
        success: false,
        errors: [{ message: 'Failed to compile', severity: 'error' }],
      });
    } finally {
      setCompiling(false);
    }
  }, [code, activeFile, saveFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S = Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        if (saveStatus === 'unsaved') {
          autoSave();
        }
      }

      // Ctrl/Cmd + Shift + F = Format
      if (modifier && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        if (!formatting) {
          formatCode();
        }
      }

      // Ctrl/Cmd + B = Compile (Build)
      if (modifier && e.key === 'b') {
        e.preventDefault();
        if (!compiling) {
          compileCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveStatus, formatting, compiling, autoSave, formatCode, compileCode]);

  // File explorer component (reusable for mobile and desktop)
  const FileExplorer = () => (
    <div className="p-3 border-b border-border">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Files
      </h3>
      <div className="space-y-1">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => {
              setActiveFile(file);
              setCode(file.content);
              setMobileTab('code'); // Switch to code view on mobile after selecting file
            }}
            className={`w-full text-left px-2 py-1.5 text-sm rounded ${
              activeFile?.id === file.id
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {file.filename}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Compilation output component (reusable)
  const CompilationOutput = () => compilationResult && (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Terminal Output
        </span>
      </div>
      <div className="p-4 max-h-48 overflow-y-auto custom-scrollbar">
        {compilationResult.success ? (
          <div className="flex items-center gap-2 text-green-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Compilation successful!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">Compilation failed</span>
            </div>
            {compilationResult.errors?.map((error, i) => (
              <pre key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded overflow-x-auto">
                {error.message}
              </pre>
            ))}
          </div>
        )}
        {compilationResult.warnings && compilationResult.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {compilationResult.warnings.map((warning, i) => (
              <pre key={i} className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded overflow-x-auto">
                {warning.message}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-border bg-card px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Button>
            </Link>
            <span className="text-sm font-medium truncate max-w-[150px]">{project.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Save status indicator */}
            {saveStatus === 'unsaved' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
            {saveStatus === 'saving' && (
              <svg className="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <Button variant="ghost" size="sm" onClick={formatCode} disabled={formatting} className="text-xs px-2">
              {formatting ? '...' : '✨'}
            </Button>
            <Button variant="outline" size="sm" onClick={compileCode} disabled={compiling} className="text-xs px-2">
              {compiling ? '...' : 'Compile'}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Desktop: Left Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex w-80 border-r border-border bg-card flex-col overflow-hidden" data-tour="lessons">
        <FileExplorer />
        <LessonSidebar
          lessons={lessons}
          progress={progress}
          currentLesson={currentLesson}
          onSelectLesson={setCurrentLesson}
          projectId={project.id}
          currentCode={code}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Toolbar (hidden on mobile) */}
        <div className="hidden lg:flex h-14 border-b border-border bg-card items-center justify-between px-4">
          {/* Left: Home + Project Name */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-sm font-medium">{project.name}</span>
              {activeFile && (
                <span className="text-xs text-muted-foreground ml-2">{activeFile.filename}</span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Save Status */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === 'saving' && (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Unsaved</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={autoSave} disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={formatCode} disabled={formatting}>
              {formatting ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Formatting...
                </>
              ) : (
                'Format'
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={compileCode} disabled={compiling} data-tour="compile">
              {compiling ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Compiling...
                </>
              ) : (
                'Compile'
              )}
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <div data-tour="deploy">
            <DeployButton
              projectId={project.id}
              code={code}
              contractName={activeFile?.filename.replace('.sol', '') || 'Contract'}
              compilationResult={compilationResult}
              onCompile={compileCode}
              onDeploySuccess={(address, txHash) => {
                setDeployedContract(address);
                if (compilationResult?.abi) {
                  setContractAbi(compilationResult.abi);
                }
              }}
            />
            </div>
            <ExportButton
              project={project}
              files={files}
              currentCode={code}
              activeFileName={activeFile?.filename}
            />
            {deployedContract && (
              <>
                <Link href={`/share/${project.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </Button>
                </Link>
                <FrontendGenerator
                  projectId={project.id}
                  projectName={project.name}
                  contractAddress={deployedContract}
                  contractAbi={contractAbi}
                  network={project.network}
                />
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant={isProjectPublic ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    const newValue = !isProjectPublic;
                    const { error } = await supabase
                      .from('projects')
                      .update({ is_public: newValue })
                      .eq('id', project.id);
                    if (!error) setIsProjectPublic(newValue);
                  }}
                >
                  {isProjectPublic ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      In Showcase
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Add to Showcase
                    </>
                  )}
                </Button>
              </>
            )}
            <div className="w-px h-6 bg-border mx-1" />
            <ThemeToggle />
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={startTour} title="Restart Tour">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Main Editor + Chat (Desktop) / Tab Content (Mobile) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile: Tab Content */}
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
            {mobileTab === 'code' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1">
                  <MonacoEditor
                    height="100%"
                    language="sol"
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      wordWrap: 'on',
                    }}
                  />
                </div>
                <CompilationOutput />
                {deployedContract && compilationResult?.abi && (
                  <ContractInteraction contractAddress={deployedContract} abi={compilationResult.abi} />
                )}
              </div>
            )}
            {mobileTab === 'lessons' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-card">
                <FileExplorer />
                <LessonSidebar
                  lessons={lessons}
                  progress={progress}
                  currentLesson={currentLesson}
                  onSelectLesson={(lesson) => {
                    setCurrentLesson(lesson);
                    setMobileTab('code'); // Switch to code after selecting lesson
                  }}
                  projectId={project.id}
                  currentCode={code}
                />
              </div>
            )}
            {mobileTab === 'chat' && (
              <div className="flex-1 overflow-hidden">
                <TutorChat project={project} currentLesson={currentLesson} currentCode={code} />
              </div>
            )}
          </div>

          {/* Desktop: Code Editor */}
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden" data-tour="editor">
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language="sol"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                }}
              />
            </div>
            <CompilationOutput />
            {deployedContract && compilationResult?.abi && (
              <ContractInteraction contractAddress={deployedContract} abi={compilationResult.abi} />
            )}
          </div>

          {/* Desktop: Tutor Chat */}
          {showChat && (
            <div className="hidden lg:block w-[480px] border-l border-border" data-tour="chat">
              <TutorChat project={project} currentLesson={currentLesson} currentCode={code} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden border-t border-border bg-card">
        <div className="flex">
          <button
            onClick={() => setMobileTab('code')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
              mobileTab === 'code' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Code
          </button>
          <button
            onClick={() => setMobileTab('lessons')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
              mobileTab === 'lessons' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Lessons
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
              mobileTab === 'chat' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            AI Tutor
          </button>
        </div>
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour 
        projectId={project.id} 
        forceShow={showTour}
        onComplete={endTour}
      />
    </div>
  );
}
