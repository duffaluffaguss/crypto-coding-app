'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ContractTemplate, getDifficultyColor, getCategoryColor } from '@/lib/contract-templates';

interface TemplateCardProps {
  template: ContractTemplate;
  onUseTemplate: (template: ContractTemplate) => void;
}

export function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Card className="h-full hover:border-primary/50 transition-colors group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{template.icon}</span>
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
          
          {/* Features */}
          <div className="flex flex-wrap gap-1.5">
            {template.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="px-2 py-0.5 text-xs bg-muted rounded-md text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowPreview(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onUseTemplate(template)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Use Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              {template.name}
            </DialogTitle>
            <DialogDescription>
              {template.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              <code>{template.code}</code>
            </pre>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => {
              onUseTemplate(template);
              setShowPreview(false);
            }}>
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
