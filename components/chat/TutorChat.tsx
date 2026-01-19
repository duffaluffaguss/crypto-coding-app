'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Project, Lesson } from '@/types';

interface TutorChatProps {
  project: Project;
  currentLesson: Lesson | null;
  currentCode: string;
}

export function TutorChat({ project, currentLesson, currentCode }: TutorChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [hintLevel, setHintLevel] = useState(0);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/ai/chat',
    body: {
      context: {
        projectName: project.name,
        projectType: project.project_type,
        currentLesson: currentLesson?.title || 'Getting Started',
        currentGoal: currentLesson?.description || 'Build your first smart contract',
        currentCode,
      },
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hey! I'm Sol, your Solidity mentor. I'm here to help you build **${project.name}**.\n\nI won't write the code for you, but I'll guide you every step of the way. Ask me anything about your current lesson or if you're stuck!\n\nWhat would you like to learn first?`,
      },
    ],
    onFinish: async (message) => {
      // Persist assistant message to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            project_id: project.id,
            role: 'assistant',
            content: message.content,
          });
        }
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    },
  });

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        const loadedMessages = history.map((msg, index) => ({
          id: msg.id || `msg-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
        setMessages(loadedMessages);
      }
    };

    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save user message to database before sending
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          project_id: project.id,
          role: 'user',
          content: input.trim(),
        });
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }

    handleSubmit(e);
  };

  // Request a hint
  const requestHint = async () => {
    const newHintLevel = Math.min(hintLevel + 1, 3);
    setHintLevel(newHintLevel);

    const hintRequest = `I need a hint for this lesson. This is hint request #${newHintLevel}. My current goal is: ${currentLesson?.description || 'Build my smart contract'}. Please give me a ${newHintLevel === 1 ? 'gentle nudge in the right direction' : newHintLevel === 2 ? 'more specific hint' : 'very detailed hint without giving the full answer'}.`;

    // Simulate form submission with hint request
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;

    // Save hint request
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          project_id: project.id,
          role: 'user',
          content: hintRequest,
        });
      }
    } catch (error) {
      console.error('Failed to save hint request:', error);
    }

    // Manually append message and trigger API call
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: hintRequest },
    ]);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Code blocks
      line = line.replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm font-mono">$1</code>');
      return <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Sol - AI Tutor</h3>
            <p className="text-xs text-muted-foreground">
              {currentLesson?.title || 'Getting Started'}
            </p>
          </div>
          {/* Hint button */}
          <Button
            variant="outline"
            size="sm"
            onClick={requestHint}
            disabled={isLoading}
            className="text-xs"
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Hint {hintLevel > 0 && `(${hintLevel}/3)`}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[95%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto custom-scrollbar text-sm leading-relaxed">
                  {formatMessage(message.content)}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto custom-scrollbar text-sm">
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                }
              }
            }}
            placeholder="Ask Sol anything... (Shift+Enter for new line)"
            disabled={isLoading}
            rows={2}
            className="flex-1 min-h-[60px] max-h-40 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto"
            style={{
              height: 'auto',
              minHeight: '60px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 160) + 'px';
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
      </form>
    </div>
  );
}
