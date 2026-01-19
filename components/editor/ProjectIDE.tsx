'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { TutorChat } from '@/components/chat/TutorChat';
import { LessonSidebar } from '@/components/lessons/LessonSidebar';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { DeployButton } from '@/components/wallet/DeployButton';
import { ContractInteraction } from '@/components/wallet/ContractInteraction';
import { FrontendGenerator } from '@/components/wallet/FrontendGenerator';
import { LearnButton } from '@/components/learn/LearnModal';
import { TestTokensPrompt, WalletBalance } from '@/components/wallet/TestTokensPrompt';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ExportButton } from '@/components/editor/ExportButton';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Project, ProjectFile, Lesson, LearningProgress, CompilationResult } from '@/types';

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
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

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

  const saveFile = async () => {
    if (!activeFile) return;

    await supabase
      .from('project_files')
      .update({ content: code })
      .eq('id', activeFile.id);

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: code } : f))
    );
  };

  const compileCode = async () => {
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
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* File Explorer & Lessons */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* File Explorer */}
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

        {/* Lessons */}
        <LessonSidebar
          lessons={lessons}
          progress={progress}
          currentLesson={currentLesson}
          onSelectLesson={setCurrentLesson}
          projectId={project.id}
          currentCode={code}
        />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
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
                <span className="text-xs text-muted-foreground ml-2">
                  {activeFile.filename}
                </span>
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
            <Button variant="outline" size="sm" onClick={compileCode} disabled={compiling}>
              {compiling ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Compiling...
                </>
              ) : (
                'Compile'
              )}
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <div className="flex items-center gap-2">
              <ConnectButton />
              <WalletBalance />
            </div>
            <DeployButton
              projectId={project.id}
              code={code}
              contractName={activeFile?.filename.replace('.sol', '') || 'Contract'}
              compilationResult={compilationResult}
              onCompile={compileCode}
              onDeploySuccess={(address, txHash) => {
                setDeployedContract(address);
                // Update the ABI state from compilation result
                if (compilationResult?.abi) {
                  setContractAbi(compilationResult.abi);
                }
              }}
            />
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
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
              </>
            )}
            <div className="w-px h-6 bg-border mx-1" />
            <LearnButton />
            <ThemeToggle />
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Editor + Chat */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
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

            {/* Compilation Output / Terminal */}
            {compilationResult && (
              <div className="border-t border-border bg-card">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Terminal Output
                  </span>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto custom-scrollbar">
                {compilationResult.success ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">
                      Compilation successful!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="font-medium">Compilation failed</span>
                    </div>
                    {compilationResult.errors?.map((error, i) => (
                      <pre
                        key={i}
                        className="text-xs text-destructive bg-destructive/10 p-2 rounded overflow-x-auto"
                      >
                        {error.message}
                      </pre>
                    ))}
                  </div>
                )}
                {compilationResult.warnings && compilationResult.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {compilationResult.warnings.map((warning, i) => (
                      <pre
                        key={i}
                        className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded overflow-x-auto"
                      >
                        {warning.message}
                      </pre>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Contract Interaction Panel */}
            {deployedContract && compilationResult?.abi && (
              <ContractInteraction
                contractAddress={deployedContract}
                abi={compilationResult.abi}
              />
            )}
          </div>

          {/* Tutor Chat */}
          {showChat && (
            <div className="w-80 border-l border-border">
              <TutorChat
                project={project}
                currentLesson={currentLesson}
                currentCode={code}
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Tokens Prompt - shows when wallet has low balance */}
      <TestTokensPrompt />
    </div>
  );
}
