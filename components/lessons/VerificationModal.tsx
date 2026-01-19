'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: string;
  lessonTitle: string;
  isConfirming: boolean;
}

export function VerificationModal({
  isOpen,
  onClose,
  onConfirm,
  summary,
  lessonTitle,
  isConfirming,
}: VerificationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Code Compiled Successfully!
          </DialogTitle>
          <DialogDescription>
            Here&apos;s what you built for <strong>{lessonTitle}</strong>:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
            {summary}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            Go Back & Edit
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            className="gap-2"
          >
            {isConfirming ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Confirming...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Yes, Continue to Next Lesson
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VerificationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: Array<{ message: string }>;
}

export function VerificationErrorModal({
  isOpen,
  onClose,
  errors,
}: VerificationErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Code Has Errors
          </DialogTitle>
          <DialogDescription>
            Your code doesn&apos;t compile yet. Fix the errors below and try again!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 max-h-60 overflow-auto">
          {errors.map((error, i) => (
            <pre
              key={i}
              className="text-xs text-destructive bg-destructive/10 p-3 rounded overflow-x-auto whitespace-pre-wrap"
            >
              {error.message}
            </pre>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Back to Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
