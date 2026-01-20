'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface TestCase {
  id: string;
  description: string;
  expectedOutput: string;
}

interface TestCaseBuilderProps {
  testCases: TestCase[];
  onTestCasesChange: (testCases: TestCase[]) => void;
}

export function TestCaseBuilder({ testCases, onTestCasesChange }: TestCaseBuilderProps) {
  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: `tc_${Date.now()}`,
      description: '',
      expectedOutput: '',
    };
    onTestCasesChange([...testCases, newTestCase]);
  };

  const updateTestCase = (id: string, field: keyof Omit<TestCase, 'id'>, value: string) => {
    onTestCasesChange(
      testCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    );
  };

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      onTestCasesChange(testCases.filter((tc) => tc.id !== id));
    }
  };

  const isValid = testCases.length > 0 && testCases.every(tc => 
    tc.description.trim() !== '' && tc.expectedOutput.trim() !== ''
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Test Cases *</span>
          {isValid && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              Valid
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Define what the submitted code should accomplish. Provide specific test cases that validate the functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testCases.map((testCase, idx) => (
          <Card key={testCase.id} className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium">
                  #{idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Test Description *</Label>
                    <Input
                      value={testCase.description}
                      onChange={(e) => updateTestCase(testCase.id, 'description', e.target.value)}
                      placeholder="e.g., Contract should have a deposit function that accepts ETH"
                      className={testCase.description.trim() === '' ? 'border-red-300' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Behavior/Output *</Label>
                    <Textarea
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                      placeholder="e.g., The deposit function should update the user's balance and emit a Deposit event"
                      rows={2}
                      className={testCase.expectedOutput.trim() === '' ? 'border-red-300' : ''}
                    />
                  </div>
                </div>
                {testCases.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTestCase(testCase.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button 
          type="button" 
          variant="outline" 
          onClick={addTestCase} 
          className="w-full border-dashed border-2 hover:border-blue-500 hover:text-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Test Case
        </Button>

        {testCases.length === 0 && (
          <p className="text-sm text-red-500 text-center py-2">
            At least one test case is required
          </p>
        )}
      </CardContent>
    </Card>
  );
}