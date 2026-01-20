'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [hintCounts, setHintCounts] = useState<Record<string, number>>({});
  const [introducedLessons, setIntroducedLessons] = useState<Set<string>>(new Set());
  const [loadingIntro, setLoadingIntro] = useState(false);
  const [hasHistory, setHasHistory] = useState<boolean | null>(null);

  // Get current lesson's hint count
  const currentHintCount = currentLesson ? (hintCounts[currentLesson.id] || 0) : 0;

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
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
    initialMessages: [], // Start empty, we'll add welcome/welcome-back after checking history
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
      if (!user) {
        setHasHistory(false);
        return;
      }

      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        // Has history - load it and show "welcome back" message first
        const welcomeBack = {
          id: 'welcome-back',
          role: 'assistant' as const,
          content: `👋 **Welcome back!** Ready to continue building **${project.name}**?\n\nI remember where we left off. Click a lesson on the left to jump back in, or ask me anything!`,
        };
        
        const loadedMessages = history.map((msg, index) => ({
          id: msg.id || `msg-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
        
        // Put history first, then welcome back at the end (newest)
        setMessages([...loadedMessages, welcomeBack]);
        setHasHistory(true);
        
        // Count existing hint requests per lesson to restore hint levels
        const hintPattern = /hint request #(\d+)/i;
        const counts: Record<string, number> = {};
        history.forEach((msg) => {
          const match = msg.content.match(hintPattern);
          if (match) {
            // We can't easily know which lesson it was for, so we'll just track globally for now
            // A better approach would be to store lesson_id with the message
          }
        });
        setHintCounts(counts);
      } else {
        // No history - show first-time welcome (don't save to DB, it's just a greeting)
        const welcome = {
          id: 'welcome',
          role: 'assistant' as const,
          content: `👋 Hey there! I'm **Sol**, your personal coding tutor!\n\nI'm here to guide you through building **${project.name}** step by step. I'll:\n\n🎓 **Explain concepts** in simple terms\n📖 **Define new terms** as we go\n✍️ **Help you fill in the code** with guidance\n💡 **Give hints** when you're stuck\n\nLet's make learning to code fun! When you're ready, I'll introduce your first lesson. Just say **"Let's start!"** or click the lesson on the left.`,
        };
        setMessages([welcome]);
        setHasHistory(false);
      }
    };

    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Proactively introduce new lessons
  const fetchLessonIntro = useCallback(async (lesson: Lesson) => {
    if (introducedLessons.has(lesson.id) || loadingIntro) return;
    
    setLoadingIntro(true);
    try {
      const response = await fetch('/api/ai/lesson-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonDescription: lesson.description,
          lessonConcepts: lesson.concepts,
          projectType: project.project_type,
          projectName: project.name,
        }),
      });

      if (response.ok) {
        const { intro } = await response.json();
        
        // Add the intro as an assistant message
        const introMessage = {
          id: `intro-${lesson.id}`,
          role: 'assistant' as const,
          content: intro,
        };
        
        setMessages(prev => [...prev, introMessage]);
        setIntroducedLessons(prev => new Set(prev).add(lesson.id));

        // Save to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            project_id: project.id,
            role: 'assistant',
            content: intro,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch lesson intro:', error);
    } finally {
      setLoadingIntro(false);
    }
  }, [introducedLessons, loadingIntro, project, setMessages, supabase]);

  // Trigger lesson intro when lesson changes
  useEffect(() => {
    if (currentLesson && !introducedLessons.has(currentLesson.id)) {
      // Small delay to let the user see the lesson selection
      const timer = setTimeout(() => {
        fetchLessonIntro(currentLesson);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLesson, introducedLessons, fetchLessonIntro]);

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

  // Request a hint - progressively more helpful
  const requestHint = async () => {
    const lessonId = currentLesson?.id || 'default';
    const currentCount = hintCounts[lessonId] || 0;
    const newHintLevel = currentCount + 1;
    
    // Update hint count for this lesson
    setHintCounts(prev => ({
      ...prev,
      [lessonId]: newHintLevel,
    }));

    // Progressive hint levels with clear instructions for the AI
    let hintInstruction: string;
    let hintLabel: string;
    
    if (newHintLevel === 1) {
      hintLabel = "LEVEL 1 - Gentle Nudge";
      hintInstruction = "Give me a GENTLE NUDGE. Just point me in the right direction without being too specific. Maybe ask a guiding question or mention a concept I should think about.";
    } else if (newHintLevel === 2) {
      hintLabel = "LEVEL 2 - Specific Hint";
      hintInstruction = "I need a MORE SPECIFIC HINT now. Tell me exactly what part of the code I should focus on, what function or line to look at, and what concept applies here.";
    } else if (newHintLevel === 3) {
      hintLabel = "LEVEL 3 - Detailed Walkthrough";
      hintInstruction = "I really need a DETAILED WALKTHROUGH. Show me the structure of what I need to write, explain each part step by step, and give me code with blanks (___) that I fill in.";
    } else {
      hintLabel = `LEVEL ${newHintLevel} - Almost the Answer`;
      hintInstruction = "I'm really stuck! Give me almost the complete answer with just ONE small thing left for me to figure out. Show me most of the code and explain exactly what it does.";
    }

    const hintRequest = `🆘 **${hintLabel}** (hint #${newHintLevel} for this lesson)

My current goal: ${currentLesson?.description || 'Build my smart contract'}

${hintInstruction}

IMPORTANT: This is hint #${newHintLevel}. Each hint should be MORE helpful and MORE specific than the last. Don't repeat the same advice - escalate your help!`;

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

    // Use append to add message AND trigger API call
    append({
      role: 'user',
      content: hintRequest,
    });
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
            {loadingIntro ? (
              <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-lg">🌱</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Sol - AI Tutor</h3>
            <p className="text-xs text-muted-foreground">
              {loadingIntro ? 'Preparing your lesson...' : currentLesson?.title || 'Getting Started'}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-1 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={requestHint}
            disabled={isLoading || loadingIntro}
            className="text-xs flex-1"
            title={currentHintCount > 0 ? `Click for hint level ${currentHintCount + 1}` : 'Get a hint'}
          >
            💡 {currentHintCount > 0 ? `Hint (${currentHintCount})` : 'Hint'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const message = "Can you explain the key terms and concepts for this lesson in simple words?";
              handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLTextAreaElement>);
            }}
            disabled={isLoading || loadingIntro}
            className="text-xs flex-1"
          >
            📖 Explain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const message = "I'm stuck! Can you show me what code I need to write with blanks for me to fill in?";
              handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLTextAreaElement>);
            }}
            disabled={isLoading || loadingIntro}
            className="text-xs flex-1"
          >
            ✍️ Guide
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {loadingIntro && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 max-w-[95%]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Sol is preparing your lesson introduction...</span>
              </div>
            </div>
          </div>
        )}
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
                <div className="prose prose-sm dark:prose-invert text-sm leading-relaxed">
                  {formatMessage(message.content)}
                </div>
              ) : (
                <div className="text-sm">
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
