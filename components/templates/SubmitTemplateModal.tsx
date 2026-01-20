'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { X, Plus, Eye, Code, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { CodeEditor } from '@/components/editor/CodeEditor';

interface SubmitTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  initialCode?: any; // Pre-populate with existing project code
  initialProjectType?: string;
}

export function SubmitTemplateModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialCode, 
  initialProjectType 
}: SubmitTemplateModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState(initialProjectType || '');
  const [code, setCode] = useState(initialCode || {});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const projectTypes = [
    { value: 'defi', label: 'DeFi' },
    { value: 'nft', label: 'NFT' },
    { value: 'dao', label: 'DAO' },
    { value: 'token', label: 'Token' },
    { value: 'game', label: 'Game' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'utility', label: 'Utility' },
    { value: 'other', label: 'Other' }
  ];

  const popularTags = [
    'beginner', 'advanced', 'solidity', 'react', 'nextjs', 'web3',
    'ethereum', 'polygon', 'smart-contract', 'frontend', 'backend',
    'full-stack', 'tutorial', 'boilerplate', 'library', 'framework'
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      if (!initialCode && !initialProjectType) {
        setName('');
        setDescription('');
        setProjectType('');
        setCode({});
        setTags([]);
        setNewTag('');
      }
      setShowPreview(false);
    }
  }, [isOpen, initialCode, initialProjectType]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return false;
    }
    if (!description.trim()) {
      toast.error('Template description is required');
      return false;
    }
    if (!projectType) {
      toast.error('Project type is required');
      return false;
    }
    if (!code || Object.keys(code).length === 0) {
      toast.error('Template code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit a template');
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('community_templates')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim(),
          code,
          project_type: projectType,
          tags,
          is_approved: false // Templates need approval
        });

      if (error) throw error;

      toast.success('Template submitted successfully! It will be reviewed before appearing in the community.');
      onSubmit();
    } catch (error) {
      console.error('Error submitting template:', error);
      toast.error('Failed to submit template');
    } finally {
      setLoading(false);
    }
  };

  const renderCodePreview = () => {
    if (!code || Object.keys(code).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No code provided yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(code).map(([filename, fileContent]) => (
          <div key={filename} className="border rounded-lg">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filename}
              </p>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {typeof fileContent === 'string' ? fileContent : JSON.stringify(fileContent, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submit Community Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Simple DeFi Staking Contract"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what your template does, what features it includes, and how others can use it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-3">
              {/* Popular tags */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      disabled={tags.includes(tag)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        tags.includes(tag)
                          ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Template Code *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>

            <Card className="p-4">
              {showPreview ? (
                renderCodePreview()
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provide the code files for your template. You can upload files or paste code directly.
                  </p>
                  
                  {/* Simple code input for now - in a real app you'd want a more sophisticated editor */}
                  <Textarea
                    placeholder="Paste your template code here (JSON format with filename keys)..."
                    value={JSON.stringify(code, null, 2)}
                    onChange={(e) => {
                      try {
                        setCode(JSON.parse(e.target.value));
                      } catch {
                        // Invalid JSON, keep the text in a temporary state
                      }
                    }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  
                  <p className="text-xs text-gray-500">
                    Expected format: {`{"ContractName.sol": "contract code...", "frontend/App.js": "react code..."}`}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Submit Section */}
          <div className="border-t pt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Review Process
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your template will be reviewed by our team before appearing in the community. 
                This helps ensure quality and security. You'll be notified once it's approved.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Template'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}