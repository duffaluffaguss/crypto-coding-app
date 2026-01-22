'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SNIPPET_CATEGORIES } from '@/lib/code-snippets';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SubmitSnippetForm() {
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
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Pre-fill with code if passed via query params (from IDE)
    const preCode = searchParams.get('code');
    const preName = searchParams.get('name');
    const preDescription = searchParams.get('description');
    
    if (preCode) {
      setFormData(prev => ({
        ...prev,
        code: decodeURIComponent(preCode),
        name: preName ? decodeURIComponent(preName) : '',
        description: preDescription ? decodeURIComponent(preDescription) : ''
      }));
    }
  }, [searchParams]);

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

      router.push('/snippets?tab=mine');
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/snippets">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Snippets
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Submit Code Snippet</h1>
        <p className="text-muted-foreground mt-2">
          Share your useful Solidity code snippets with the community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Snippet Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Safe Transfer Function"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this snippet does and when to use it..."
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.19;&#10;&#10;// Your code here..."
                className="min-h-[200px] font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="erc20, transfer, security (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Add tags to help others find your snippet
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPublic" className="text-sm font-normal">
                Make this snippet public (visible to all users)
              </Label>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim() || !formData.code.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Snippet'}
            </Button>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Preview</h2>
          
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    {formData.name || 'Snippet Name'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {formData.description || 'Snippet description...'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {SNIPPET_CATEGORIES[formData.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                </Badge>
              </div>
              {parseTagsArray(formData.tags).length > 0 && (
                <div className="flex gap-1 mt-3">
                  {parseTagsArray(formData.tags).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <pre className="p-3 text-sm bg-muted/30 rounded-md overflow-x-auto max-h-64 border">
                <code>{formData.code || '// Your code will appear here...'}</code>
              </pre>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" disabled>
                  ❤️ 0
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled>
                  📥 0
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-muted/20 rounded-lg">
            <h3 className="font-medium mb-2">📝 Tips for great snippets:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use clear, descriptive names</li>
              <li>• Include comments explaining complex logic</li>
              <li>• Add proper error handling</li>
              <li>• Follow Solidity best practices</li>
              <li>• Test your code before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitSnippetPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <SubmitSnippetForm />
    </Suspense>
  );
}