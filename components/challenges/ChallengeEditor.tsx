'use client';

import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface ChallengeEditorProps {
  starterCode: string;
  onCodeChange: (code: string) => void;
}

export function ChallengeEditor({ starterCode, onCodeChange }: ChallengeEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Starter Code *
        </CardTitle>
        <CardDescription>
          Provide the initial code structure that users will build upon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Solidity Code</Label>
          <div className="border rounded-lg overflow-hidden">
            <Editor
              height="300px"
              language="sol"
              theme="vs-dark"
              value={starterCode}
              onChange={(value) => onCodeChange(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Include TODO comments to guide users on what they need to implement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}