'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, Send, Bug, Lightbulb, MessageCircle, CheckCircle } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackTypeOption {
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const feedbackTypes: FeedbackTypeOption[] = [
  {
    value: 'bug',
    label: 'Bug Report',
    icon: <Bug className="w-4 h-4" />,
    description: 'Something is broken',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    icon: <Lightbulb className="w-4 h-4" />,
    description: 'Suggest an improvement',
  },
  {
    value: 'general',
    label: 'General Feedback',
    icon: <MessageCircle className="w-4 h-4" />,
    description: 'Share your thoughts',
  },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow animation
      const timer = setTimeout(() => {
        if (!showSuccess) {
          setType('general');
          setMessage('');
          setError(null);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showSuccess]);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setType('general');
        setMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message,
          pageUrl: pathname,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Success Message */}
      {showSuccess && (
        <div className="absolute bottom-16 right-0 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 min-w-[200px]">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Thanks for your feedback!</span>
        </div>
      )}

      {/* Feedback Form */}
      {isOpen && !showSuccess && (
        <div className="absolute bottom-16 right-0 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Send Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close feedback form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {feedbackTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      type === option.value
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                        : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {option.icon}
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label htmlFor="feedback-message" className="text-sm font-medium text-gray-300">
                Message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Describe what went wrong...'
                    : type === 'feature'
                    ? 'Describe your idea...'
                    : 'Share your thoughts...'
                }
                rows={4}
                maxLength={5000}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 text-right">
                {message.length}/5000
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>

            {/* Page URL indicator */}
            <p className="text-xs text-gray-500 text-center">
              Submitting from: {pathname}
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-violet-600 hover:bg-violet-500 hover:scale-110'
        }`}
        aria-label={isOpen ? 'Close feedback' : 'Send feedback'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageSquarePlus className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}
