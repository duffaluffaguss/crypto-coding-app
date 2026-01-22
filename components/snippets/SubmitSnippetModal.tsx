'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SNIPPET_CATEGORIES } from '@/lib/code-snippets';

interface SubmitSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledCode?: string;
  selectedText?: string;
}

export function SubmitSnippetModal({ 
  isOpen, 
  onClose, 
  prefilledCode = '', 
  selectedText = '' 
}: SubmitSnippetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    category: 'basics',
    tags: '',
    isPublic: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const supabase = createClient();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        code: selectedText || prefilledCode || '',
        category: 'basics',
        tags: '',
        isPublic: true
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen, prefilledCode, selectedText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to submit snippets');
        return;
      }

      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: insertError } = await supabase
        .from('user_snippets')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          code: formData.code.trim(),
          category: formData.category,
          tags: tags,
          is_public: formData.isPublic
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting snippet:', error);
      setError('Failed to submit snippet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const parseTagsArray = (tagsString: string) => {
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Snippet Submitted!</h3>
            <p className="text-muted-foreground">
              Your code snippet has been successfully submitted and will be available in the community section.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Code Snippet</DialogTitle>
          <DialogDescription>
            Share your useful code snippet with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name">Snippet Name</Label>
              <Input
                id="modal-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Safe Transfer Function"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SNIPPET_CATEGORIES).map(([key, { name, icon }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-description">Description</Label>
            <Textarea
              id="modal-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this snippet does and when to use it..."
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-code">Code</Label>
            <Textarea
              id="modal-code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="// Your Solidity code here..."
              className="min-h-[150px] font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-tags">Tags (optional)</Label>
            <Input
              id="modal-tags"
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="erc20, transfer, security (comma-separated)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="modal-isPublic"
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="modal-isPublic" className="text-sm font-normal">
              Make this snippet public (visible to all users)
            </Label>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-medium mb-3">Preview</h3>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">
                    {formData.name || 'Snippet Name'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description || 'Snippet description...'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {SNIPPET_CATEGORIES[formData.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                </Badge>
              </div>
              {parseTagsArray(formData.tags).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {parseTagsArray(formData.tags).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <pre className="p-2 text-xs bg-background/50 rounded border overflow-x-auto max-h-24">
                <code>{formData.code || '// Your code will appear here...'}</code>
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim() || !formData.code.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Snippet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}