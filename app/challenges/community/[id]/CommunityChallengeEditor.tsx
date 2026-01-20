'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, Play, RotateCcw } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CommunityChallengeEditorProps {
  challengeId: string;
  userId: string;
  starterCode: string;
  points: number;
  isCompleted: boolean;
  previousCode?: string;
}

export function CommunityChallengeEditor({
  challengeId,
  userId,
  starterCode,
  points,
  isCompleted: initialCompleted,
  previousCode,
}: CommunityChallengeEditorProps) {
  const router = useRouter();
  const [code, setCode] = useState(previousCode || starterCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    if (confirm('Reset code to starter template? Your changes will be lost.')) {
      setCode(starterCode);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || code.trim() === starterCode.trim()) {
      setError('Please write some code before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Check if already completed
      const { data: existing } = await supabase
        .from('user_challenge_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (existing) {
        setError('You have already completed this challenge');
        setIsCompleted(true);
        return;
      }

      // Submit completion
      const { error: insertError } = await supabase
        .from('user_challenge_completions')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          code_submitted: code,
          points_earned: points,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('You have already completed this challenge');
          setIsCompleted(true);
          return;
        }
        throw insertError;
      }

      setSubmitSuccess(true);
      setIsCompleted(true);

      // Refresh page after a delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error submitting challenge:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className="h-full">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Challenge Completed!</h2>
          <p className="text-muted-foreground mb-4">
            You earned <span className="font-semibold text-primary">{points} points</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Great job supporting community challenges!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Code Editor
            {isCompleted && (
              <span className="text-sm font-normal text-green-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b bg-[#1e1e1e]">
          <Editor
            height="450px"
            defaultLanguage="sol"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: isCompleted && !previousCode,
            }}
          />
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}

          {isCompleted && previousCode ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ve already completed this challenge. Your solution is shown above.
              </p>
            </div>
          ) : isCompleted ? (
            <div className="text-center py-4">
              <p className="text-green-500 font-medium">✓ Challenge completed</p>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Submit Solution ({points} pts)
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Community challenges are reviewed manually by creators.
            Points are awarded upon submission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
