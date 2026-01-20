'use client';

import { ChangelogEntry as ChangelogEntryType, getCategoryLabel, getCategoryColor } from '@/lib/changelog';

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
  isLatest?: boolean;
}

export function ChangelogEntry({ entry, isLatest = false }: ChangelogEntryProps) {
  const featureChanges = entry.changes.filter(c => c.category === 'feature');
  const improvementChanges = entry.changes.filter(c => c.category === 'improvement');
  const fixChanges = entry.changes.filter(c => c.category === 'fix');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-2 h-2 -translate-x-[3.5px] rounded-full ${
        isLatest ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground'
      }`} />

      {/* Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
            isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            v{entry.version}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDate(entry.date)}
          </span>
          {isLatest && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              Latest
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-xl font-bold">{entry.title}</h3>
          {entry.description && (
            <p className="mt-1 text-muted-foreground">{entry.description}</p>
          )}
        </div>

        {/* Changes by Category */}
        <div className="space-y-4">
          {featureChanges.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-green-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Features
              </h4>
              <ul className="space-y-1.5">
                {featureChanges.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {improvementChanges.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Improvements
              </h4>
              <ul className="space-y-1.5">
                {improvementChanges.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fixChanges.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Bug Fixes
              </h4>
              <ul className="space-y-1.5">
                {fixChanges.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
