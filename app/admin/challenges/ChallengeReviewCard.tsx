'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Code,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

interface TestCase {
  description: string;
  expectedOutput: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  starter_code: string;
  test_cases: TestCase[];
  solution_hint: string | null;
  points: number;
  category: string;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason: string | null;
  created_at: string;
  creator: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

interface ChallengeReviewCardProps {
  challenge: Challenge;
  reviewerId: string;
  isReadOnly?: boolean;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ChallengeReviewCard({ challenge, reviewerId, isReadOnly }: ChallengeReviewCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_challenges')
        .update({
          is_approved: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        })
        .eq('id', challenge.id);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error('Error approving challenge:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setIsRejecting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_challenges')
        .update({
          is_rejected: true,
          rejection_reason: rejectionReason.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        })
        .eq('id', challenge.id);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error('Error rejecting challenge:', err);
    } finally {
      setIsRejecting(false);
    }
  };

  const createdDate = new Date(challenge.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={challenge.is_approved ? 'border-green-500/30' : challenge.is_rejected ? 'border-red-500/30' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={difficultyColors[challenge.difficulty]}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline">{challenge.category}</Badge>
              <Badge variant="secondary">{challenge.points} pts</Badge>
              {challenge.is_approved && (
                <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
              )}
              {challenge.is_rejected && (
                <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>
              )}
            </div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {challenge.creator?.display_name || challenge.creator?.email || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {createdDate}
              </span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 border-t pt-6">
          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {challenge.description}
            </p>
          </div>

          {/* Starter Code */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Starter Code
            </h4>
            <div className="border rounded-lg overflow-hidden bg-[#1e1e1e]">
              <Editor
                height="250px"
                defaultLanguage="sol"
                value={challenge.starter_code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <h4 className="font-semibold mb-2">Test Cases ({challenge.test_cases?.length || 0})</h4>
            <div className="space-y-2">
              {(challenge.test_cases || []).map((tc, idx) => (
                <Card key={idx} className="bg-muted/30">
                  <CardContent className="py-3">
                    <p className="text-sm font-medium">#{idx + 1}: {tc.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: {tc.expectedOutput}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Solution Hint */}
          {challenge.solution_hint && (
            <div>
              <h4 className="font-semibold mb-2">Solution Hint</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 {challenge.solution_hint}
              </p>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {challenge.is_rejected && challenge.rejection_reason && (
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <h4 className="font-semibold text-red-500 mb-2">Rejection Reason</h4>
              <p className="text-sm">{challenge.rejection_reason}</p>
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="border-t pt-4">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isApproving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Rejection Reason *</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this challenge is being rejected..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                      className="flex-1"
                    >
                      {isRejecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
