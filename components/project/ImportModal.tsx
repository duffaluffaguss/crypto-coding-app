'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: string) => void;
}

interface ImportedFile {
  name: string;
  size: number;
  type: 'solidity' | 'javascript' | 'typescript' | 'json' | 'text' | 'other';
}

export default function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [previewFiles, setPreviewFiles] = useState<ImportedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setProjectName('');
    setProjectDescription('');
    setPreviewFiles([]);
    setGithubUrl('');
  };

  const getFileType = (fileName: string): ImportedFile['type'] => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    switch (ext) {
      case '.sol':
        return 'solidity';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.json':
        return 'json';
      case '.md':
      case '.txt':
        return 'text';
      default:
        return 'other';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const previewZipContents = async (zipFile: File) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(await zipFile.arrayBuffer());
      
      const files: ImportedFile[] = [];
      const allowedExtensions = ['.sol', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt'];
      
      for (const fileName of Object.keys(zipContents.files)) {
        const zipEntry = zipContents.files[fileName];
        
        // Skip directories and hidden files
        if (zipEntry.dir || fileName.startsWith('.') || fileName.includes('/.')) {
          continue;
        }
        
        const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
        // Only show allowed file types
        if (allowedExtensions.includes(ext)) {
          files.push({
            name: fileName,
            size: zipEntry._data ? zipEntry._data.uncompressedSize || 0 : 0,
            type: getFileType(fileName)
          });
        }
      }
      
      setPreviewFiles(files.sort((a, b) => {
        // Sort Solidity files first, then by name
        if (a.type === 'solidity' && b.type !== 'solidity') return -1;
        if (b.type === 'solidity' && a.type !== 'solidity') return 1;
        return a.name.localeCompare(b.name);
      }));
      
      // Auto-generate project name from ZIP filename
      if (!projectName) {
        const baseName = zipFile.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
        setProjectName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
      
      setStep('preview');
    } catch (error) {
      console.error('Error previewing ZIP:', error);
      toast.error('Invalid ZIP file', {
        description: 'Please ensure you\'re uploading a valid ZIP archive.',
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.zip')) {
        setFile(droppedFile);
        previewZipContents(droppedFile);
      } else {
        toast.error('Invalid file type', {
          description: 'Please upload a ZIP file.',
        });
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.zip')) {
        setFile(selectedFile);
        previewZipContents(selectedFile);
      } else {
        toast.error('Invalid file type', {
          description: 'Please upload a ZIP file.',
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file || !projectName.trim()) return;

    setStep('importing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', projectName.trim());
      formData.append('projectDescription', projectDescription.trim());

      const response = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import project');
      }

      const result = await response.json();

      toast.success('Project imported successfully!', {
        description: `Imported ${result.project.filesImported} files into "${result.project.name}"`,
      });

      onSuccess?.(result.project.id);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import project', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setStep('preview'); // Go back to preview step
    }
  };

  const getFileIcon = (type: ImportedFile['type']) => {
    switch (type) {
      case 'solidity':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'javascript':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'typescript':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'json':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'text':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const solidityCount = previewFiles.filter(f => f.type === 'solidity').length;
  const hasValidFiles = solidityCount > 0;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetState();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Import a project from a ZIP file or GitHub repository
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload ZIP File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop a ZIP file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports Solidity (.sol), JavaScript/TypeScript, and other code files
                  </p>
                </div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* GitHub URL - Placeholder */}
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL (Coming Soon)</Label>
              <Input
                id="github-url"
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled
              />
              <p className="text-xs text-gray-500">
                GitHub import will be available in a future update
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            {/* Project Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* File Preview */}
            <div className="space-y-2">
              <Label>Files to Import ({previewFiles.length})</Label>
              {!hasValidFiles && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    No Solidity files found. Please ensure your ZIP contains .sol files.
                  </p>
                </div>
              )}
              
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {previewFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border-b last:border-b-0 ${
                      file.type === 'solidity' ? 'bg-purple-50 dark:bg-purple-950' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
              
              {hasValidFiles && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Found {solidityCount} Solidity file{solidityCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Importing Project...</h3>
            <p className="text-sm text-gray-500">
              Processing and validating files
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!projectName.trim() || !hasValidFiles}
              >
                Import Project
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}