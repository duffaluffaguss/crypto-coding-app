'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface LineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
  category?: 'pragma' | 'import' | 'contract' | 'variable' | 'function' | 'modifier' | 'event' | 'struct' | 'mapping' | 'comment' | 'other';
}

interface FunctionSection {
  name: string;
  startLine: number;
  endLine: number;
  purpose: string;
  explanations: LineExplanation[];
}

interface ExplainCodeResponse {
  overview: string;
  sections: FunctionSection[];
  allExplanations: LineExplanation[];
}

interface CodeExplanationsProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
  onHighlightLine: (lineNumber: number) => void;
}

const categoryColors: Record<string, string> = {
  pragma: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  import: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contract: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  variable: 'bg-green-500/20 text-green-300 border-green-500/30',
  function: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  modifier: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  event: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  struct: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  mapping: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  comment: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const categoryLabels: Record<string, string> = {
  pragma: 'Version',
  import: 'Import',
  contract: 'Contract',
  variable: 'Variable',
  function: 'Function',
  modifier: 'Modifier',
  event: 'Event',
  struct: 'Struct',
  mapping: 'Mapping',
  comment: 'Comment',
  other: 'Code',
};

export function CodeExplanations({ code, isOpen, onClose, onHighlightLine }: CodeExplanationsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<ExplainCodeResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'sections' | 'all'>('sections');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Fetch explanations when panel opens
  useEffect(() => {
    if (isOpen && code && !explanations) {
      fetchExplanations();
    }
  }, [isOpen, code]);

  // Reset when code changes significantly
  useEffect(() => {
    setExplanations(null);
    setError(null);
    setExpandedSections(new Set());
  }, [code]);

  const fetchExplanations = async () => {
    if (!code.trim()) {
      setError('No code to explain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to explain code');
      }

      const data: ExplainCodeResponse = await response.json();
      setExplanations(data);
      
      // Auto-expand first section
      if (data.sections.length > 0) {
        setExpandedSections(new Set([data.sections[0].name]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain code');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  const handleLineClick = (lineNumber: number) => {
    setSelectedLine(lineNumber);
    onHighlightLine(lineNumber);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium text-sm">Code Explanations</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full absolute top-0 animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Analyzing your code...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchExplanations} className="mt-3">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Explanations Content */}
      {explanations && !loading && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Overview */}
          <div className="p-3 border-b border-border bg-primary/5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Overview</h4>
            <p className="text-sm">{explanations.overview}</p>
          </div>

          {/* View Toggle */}
          <div className="flex p-2 border-b border-border gap-1">
            <Button
              variant={viewMode === 'sections' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('sections')}
              className="flex-1 text-xs h-7"
            >
              By Section
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('all')}
              className="flex-1 text-xs h-7"
            >
              All Lines
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {viewMode === 'sections' ? (
              /* Sections View */
              <div className="p-2 space-y-2">
                {explanations.sections.map((section) => (
                  <div key={section.name} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{section.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Lines {section.startLine}-{section.endLine}
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedSections.has(section.name) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedSections.has(section.name) && (
                      <div className="p-2 space-y-2">
                        <p className="text-xs text-muted-foreground px-2 py-1 bg-muted/20 rounded">
                          {section.purpose}
                        </p>
                        {explanations.allExplanations
                          .filter(exp => exp.lineNumber >= section.startLine && exp.lineNumber <= section.endLine)
                          .map((exp) => (
                            <ExplanationItem
                              key={exp.lineNumber}
                              explanation={exp}
                              isSelected={selectedLine === exp.lineNumber}
                              onClick={() => handleLineClick(exp.lineNumber)}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* All Lines View */
              <div className="p-2 space-y-2">
                {explanations.allExplanations.map((exp) => (
                  <ExplanationItem
                    key={exp.lineNumber}
                    explanation={exp}
                    isSelected={selectedLine === exp.lineNumber}
                    onClick={() => handleLineClick(exp.lineNumber)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="p-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={fetchExplanations} className="w-full text-xs">
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Explanations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExplanationItem({ 
  explanation, 
  isSelected, 
  onClick 
}: { 
  explanation: LineExplanation; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const category = explanation.category || 'other';
  const colorClass = categoryColors[category] || categoryColors.other;
  const label = categoryLabels[category] || 'Code';

  // Skip empty lines or just whitespace
  if (!explanation.code.trim()) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg border transition-all ${
        isSelected 
          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground font-mono">L{explanation.lineNumber}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorClass}`}>
          {label}
        </span>
      </div>
      <pre className="text-xs font-mono text-muted-foreground bg-muted/30 p-1.5 rounded overflow-x-auto mb-1.5 whitespace-pre-wrap break-all">
        {explanation.code.trim()}
      </pre>
      <p className="text-xs leading-relaxed">{explanation.explanation}</p>
    </button>
  );
}
