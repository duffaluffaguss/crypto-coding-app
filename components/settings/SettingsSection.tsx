'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  variant = 'default',
  className,
}: SettingsSectionProps) {
  return (
    <Card
      className={cn(
        variant === 'danger' && 'border-destructive/50',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          <span className={cn(variant === 'danger' && 'text-destructive')}>
            {title}
          </span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface SettingsItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsItem({ label, description, children }: SettingsItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="space-y-0.5">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
