// lib/review.ts - AI Code Review utilities for Solidity

export type Severity = 'error' | 'warning' | 'info';

export interface ReviewIssue {
  severity: Severity;
  title: string;
  description: string;
  lineNumber?: number;
  code?: string;
  suggestion?: string;
}

export interface ReviewSection {
  category: 'security' | 'gas' | 'best-practices' | 'bugs' | 'style';
  title: string;
  issues: ReviewIssue[];
}

export interface CodeReviewResult {
  summary: string;
  overallScore: number; // 1-10
  sections: ReviewSection[];
  recommendations: string[];
}

export const CODE_REVIEW_PROMPT = `You are an expert Solidity smart contract auditor. Analyze the following Solidity code and provide a comprehensive code review.

Focus on these categories:
1. **Security** - Reentrancy vulnerabilities, access control issues, integer overflow/underflow, unchecked external calls, front-running risks
2. **Gas Optimization** - Expensive operations in loops, unnecessary storage reads/writes, inefficient data types, unused variables
3. **Best Practices** - Code organization, naming conventions, comments/documentation, error handling, events usage
4. **Potential Bugs** - Logic errors, edge cases, incorrect comparisons, missing validations
5. **Code Style** - Readability, consistency, Solidity version considerations

For each issue found:
- Assign a severity: "error" (critical/security), "warning" (should fix), or "info" (suggestion)
- Provide the line number if applicable
- Give a clear title and description
- Suggest how to fix it

RESPOND WITH VALID JSON ONLY (no markdown, no backticks):
{
  "summary": "Brief 1-2 sentence summary of the code quality and main concerns",
  "overallScore": 7,
  "sections": [
    {
      "category": "security",
      "title": "Security Issues",
      "issues": [
        {
          "severity": "error",
          "title": "Reentrancy Vulnerability",
          "description": "The withdraw function sends ETH before updating state",
          "lineNumber": 25,
          "code": "payable(msg.sender).transfer(balance);",
          "suggestion": "Use the checks-effects-interactions pattern: update state before external calls"
        }
      ]
    }
  ],
  "recommendations": [
    "Consider using OpenZeppelin's ReentrancyGuard",
    "Add more comprehensive input validation"
  ]
}

If the code has no issues in a category, omit that section entirely.
If the code is very clean, still provide at least one "info" level suggestion for improvement.

CODE TO REVIEW:
`;

export function parseReviewResponse(text: string): CodeReviewResult {
  // Clean up potential markdown formatting
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  }
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  
  const parsed = JSON.parse(cleanText.trim());
  
  // Validate and sanitize the response
  const result: CodeReviewResult = {
    summary: parsed.summary || 'Review completed',
    overallScore: Math.min(10, Math.max(1, parsed.overallScore || 5)),
    sections: [],
    recommendations: parsed.recommendations || []
  };

  // Validate sections
  if (Array.isArray(parsed.sections)) {
    for (const section of parsed.sections) {
      if (section.category && section.title && Array.isArray(section.issues)) {
        const validatedSection: ReviewSection = {
          category: section.category,
          title: section.title,
          issues: section.issues.map((issue: any) => ({
            severity: ['error', 'warning', 'info'].includes(issue.severity) ? issue.severity : 'info',
            title: issue.title || 'Issue',
            description: issue.description || '',
            lineNumber: typeof issue.lineNumber === 'number' ? issue.lineNumber : undefined,
            code: issue.code,
            suggestion: issue.suggestion
          }))
        };
        result.sections.push(validatedSection);
      }
    }
  }

  return result;
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'error': return 'text-red-500';
    case 'warning': return 'text-yellow-500';
    case 'info': return 'text-blue-500';
    default: return 'text-muted-foreground';
  }
}

export function getSeverityBgColor(severity: Severity): string {
  switch (severity) {
    case 'error': return 'bg-red-500/10 border-red-500/30';
    case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'info': return 'bg-blue-500/10 border-blue-500/30';
    default: return 'bg-muted';
  }
}

export function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'error': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return '⚪';
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'security': return '🛡️';
    case 'gas': return '⛽';
    case 'best-practices': return '✨';
    case 'bugs': return '🐛';
    case 'style': return '🎨';
    default: return '📋';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-500';
  if (score >= 6) return 'text-yellow-500';
  if (score >= 4) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 8) return 'Very Good';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Fair';
  if (score >= 5) return 'Needs Work';
  if (score >= 4) return 'Poor';
  return 'Critical Issues';
}
