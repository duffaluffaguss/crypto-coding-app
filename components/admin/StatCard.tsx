'use client';

import { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  iconColor = 'text-primary',
}: StatCardProps) {
  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return Minus;
    return change > 0 ? ArrowUp : ArrowDown;
  };

  const ChangeIcon = getChangeIcon();

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
              <ChangeIcon className="w-4 h-4" />
              <span className="font-medium">
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-muted/50 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
