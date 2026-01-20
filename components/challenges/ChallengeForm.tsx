'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Trash2, Eye, Code, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface TestCase {
  id: string;
  description: string;
  expectedOutput: string;
}

interface ChallengeFormProps {
  userId: string;
}

const difficultyPoints = {
  beginner: 15,
  intermediate: 25,
  advanced: 40,
};

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ChallengeForm({ userId }: ChallengeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [category, setCategory] = useState('solidity');
  const [starterCode, setStarterCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract YourContract {
    // TODO: Add your code here
    
}`);
  const [solutionHint, setSolutionHint] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', description: '', expectedOutput: '' }
  ]);

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { id: Date.now().toString(), description: '', expectedOutput: '' }
    ]);
  };

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter(tc => tc.id !== id));
    }
  };

  const updateTestCase = (id: string, field: 'description' | 'expectedOutput', value: string) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!title.trim() || title.length < 5) {
      setError('Title must be at least 5 characters');
      setIsSubmitting(false);
      return;
    }

    if (!description.trim() || description.length < 20) {
      setError('Description must be at least 20 characters');
      setIsSubmitting(false);
      return;
    }

    if (!starterCode.trim() || starterCode.length < 50) {
      setError('Starter code must be at least 50 characters');
      setIsSubmitting(false);
      return;
    }

    const validTestCases = testCases.filter(tc => tc.description.trim() && tc.expectedOutput.trim());
    if (validTestCases.length === 0) {
      setError('Add at least one test case with description and expected output');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('user_challenges')
        .insert({
          creator_id: userId,
          title: title.trim(),
          description: description.trim(),
          difficulty,
          category,
          starter_code: starterCode,
          solution_hint: solutionHint.trim() || null,
          test_cases: validTestCases.map(tc => ({
            description: tc.description,
            expectedOutput: tc.expectedOutput,
          })),
          points: difficultyPoints[difficulty],
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/challenges');
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError('Failed to create challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Challenge Submitted!</h2>
          <p className="text-muted-foreground mb-4">
            Your challenge has been submitted for review. You&apos;ll be notified when it&apos;s approved.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to challenges...</p>
        </CardContent>
      </Card>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Preview Your Challenge</h2>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            <Code className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{title || 'Untitled Challenge'}</CardTitle>
                <CardDescription className="mt-1">Community Challenge</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={difficultyColors[difficulty]}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Badge>
                <span className="text-sm font-semibold text-primary">
                  {difficultyPoints[difficulty]} pts
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {description || 'No description provided'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Starter Code</h3>
              <div className="border rounded-lg overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="300px"
                  defaultLanguage="sol"
                  value={starterCode}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test Cases</h3>
              <div className="space-y-3">
                {testCases.filter(tc => tc.description.trim()).map((tc, idx) => (
                  <Card key={tc.id} className="bg-muted/50">
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tc.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected: {tc.expectedOutput || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {solutionHint && (
              <div>
                <h3 className="font-semibold mb-2">Hint</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 {solutionHint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
            Back to Editor
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Review'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Challenge Details
          </CardTitle>
          <CardDescription>
            Provide the basic information about your challenge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Build a Simple Token Vault"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the challenge is about and what the user needs to accomplish..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty *</Label>
              <Select value={difficulty} onValueChange={(v: 'beginner' | 'intermediate' | 'advanced') => setDifficulty(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🌱 Beginner (15 pts)</SelectItem>
                  <SelectItem value="intermediate">🔥 Intermediate (25 pts)</SelectItem>
                  <SelectItem value="advanced">⚡ Advanced (40 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solidity">Solidity</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="gas-optimization">Gas Optimization</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Starter Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Starter Code
          </CardTitle>
          <CardDescription>
            Provide the initial code template that users will start with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-[#1e1e1e]">
            <Editor
              height="350px"
              defaultLanguage="sol"
              value={starterCode}
              onChange={(value) => setStarterCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Include TODO comments to guide users on what they need to implement
          </p>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases *</CardTitle>
          <CardDescription>
            Define what the submitted code should accomplish
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testCases.map((testCase, idx) => (
            <Card key={testCase.id} className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground pt-2">#{idx + 1}</span>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={testCase.description}
                        onChange={(e) => updateTestCase(testCase.id, 'description', e.target.value)}
                        placeholder="e.g., Contract should have a deposit function that accepts ETH"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Behavior/Output</Label>
                      <Textarea
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                        placeholder="e.g., The deposit function should update the user's balance and emit a Deposit event"
                        rows={2}
                      />
                    </div>
                  </div>
                  {testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTestCase(testCase.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addTestCase} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Test Case
          </Button>
        </CardContent>
      </Card>

      {/* Solution Hint */}
      <Card>
        <CardHeader>
          <CardTitle>Solution Hint (Optional)</CardTitle>
          <CardDescription>
            Provide a helpful hint without giving away the solution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={solutionHint}
            onChange={(e) => setSolutionHint(e.target.value)}
            placeholder="e.g., Remember to use require() for input validation and emit events for important state changes"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2">{solutionHint.length}/500 characters</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => setShowPreview(true)} className="flex-1">
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Review'
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your challenge will be reviewed by our team before being published to the community.
      </p>
    </form>
  );
}
