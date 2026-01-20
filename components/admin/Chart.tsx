'use client';

import { ReactNode } from 'react';

interface ChartProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Chart({ title, subtitle, children, className = '' }: ChartProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
