'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  type CodeReviewResult,
  type ReviewSection,
  type ReviewIssue,
  type Severity,
  getSeverityColor,
  getSeverityBgColor,
  getSeverityIcon,
  getCategoryIcon,
  getScoreColor,
  getScoreLabel,
} from '@/lib/review';

interface CodeReviewProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
  onHighlightLine?: (lineNumber: number) => void;
}

export function CodeReview({ code, isOpen, onClose, onHighlightLine }: CodeReviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const runReview = useCallback(async () => {
    if (!code.trim()) {
      setError('No code to review');
      return;
    }

    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review code');
      }

      setReviewResult(data);
      // Expand all sections by default
      const allCategories = new Set<string>(data.sections?.map((s: ReviewSection) => s.category) || []);
      setExpandedSections(allCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review code');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleLineClick = (lineNumber: number | undefined) => {
    if (lineNumber && onHighlightLine) {
      onHighlightLine(lineNumber);
    }
  };

  const countIssuesBySeverity = (severity: Severity): number => {
    if (!reviewResult) return 0;
    return reviewResult.sections.reduce(
      (count, section) => count + section.issues.filter((i) => i.severity === severity).length,
      0
    );
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold">AI Code Review</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runReview}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Reviewing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {reviewResult ? 'Re-analyze' : 'Analyze Code'}
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Initial State */}
        {!loading && !error && !reviewResult && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🔍</div>
            <h4 className="font-medium text-lg mb-2">Ready to Review</h4>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              Click &quot;Analyze Code&quot; to get AI-powered feedback on security, gas optimization, and best practices.
            </p>
            <Button onClick={runReview} disabled={!code.trim()}>
              Start Review
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground">Analyzing your code...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">❌</div>
            <h4 className="font-medium text-lg mb-2 text-red-500">Review Failed</h4>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button onClick={runReview} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {reviewResult && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">Overall Score</h4>
                  <p className="text-sm text-muted-foreground mt-1">{reviewResult.summary}</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(reviewResult.overallScore)}`}>
                    {reviewResult.overallScore}/10
                  </div>
                  <div className={`text-sm ${getScoreColor(reviewResult.overallScore)}`}>
                    {getScoreLabel(reviewResult.overallScore)}
                  </div>
                </div>
              </div>
              
              {/* Issue Summary */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-500">🔴</span>
                  <span className="text-sm">{countIssuesBySeverity('error')} Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-500">🟡</span>
                  <span className="text-sm">{countIssuesBySeverity('warning')} Warnings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500">🔵</span>
                  <span className="text-sm">{countIssuesBySeverity('info')} Info</span>
                </div>
              </div>
            </div>

            {/* Sections */}
            {reviewResult.sections.map((section) => (
              <div key={section.category} className="border border-border rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.category)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(section.category)}</span>
                    <span className="font-medium">{section.title}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedSections.has(section.category) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Issues */}
                {expandedSections.has(section.category) && (
                  <div className="divide-y divide-border">
                    {section.issues.map((issue, idx) => (
                      <IssueCard
                        key={idx}
                        issue={issue}
                        onLineClick={handleLineClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Recommendations */}
            {reviewResult.recommendations.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <span>💡</span> Recommendations
                </h4>
                <ul className="space-y-2">
                  {reviewResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty State */}
            {reviewResult.sections.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✨</div>
                <h4 className="font-medium text-lg mb-2 text-green-500">Great Job!</h4>
                <p className="text-muted-foreground text-sm">
                  No significant issues found. Your code looks clean!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Issue Card Component
interface IssueCardProps {
  issue: ReviewIssue;
  onLineClick: (lineNumber: number | undefined) => void;
}

function IssueCard({ issue, onLineClick }: IssueCardProps) {
  const [expanded, setExpanded] = useState(issue.severity === 'error');

  return (
    <div className={`p-4 ${getSeverityBgColor(issue.severity)} border-l-2`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getSeverityIcon(issue.severity)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h5 className={`font-medium ${getSeverityColor(issue.severity)}`}>
              {issue.title}
            </h5>
            {issue.lineNumber && (
              <button
                onClick={() => onLineClick(issue.lineNumber)}
                className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors flex-shrink-0"
              >
                Line {issue.lineNumber}
              </button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>

          {/* Code Snippet */}
          {issue.code && (
            <div className="mt-2">
              <code className="text-xs bg-black/30 px-2 py-1 rounded block overflow-x-auto">
                {issue.code}
              </code>
            </div>
          )}

          {/* Suggestion */}
          {issue.suggestion && (
            <div className="mt-2 text-sm">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <span>💡 How to fix</span>
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded && (
                <p className="mt-2 p-2 bg-muted/50 rounded text-muted-foreground">
                  {issue.suggestion}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeReview;
