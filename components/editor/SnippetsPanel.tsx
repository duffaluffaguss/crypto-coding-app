'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { CODE_SNIPPETS, SNIPPET_CATEGORIES, getSnippetsByCategory, type CodeSnippet } from '@/lib/code-snippets';

interface UserSnippet {
  id: string;
  user_id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  tags: string[];
  is_official: boolean;
  likes_count: number;
  downloads_count: number;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

interface SnippetsPanelProps {
  onInsert: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SnippetsPanel({ onInsert, isOpen, onClose }: SnippetsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('official');
  const [activeCategory, setActiveCategory] = useState<string>('basics');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userSnippets, setUserSnippets] = useState<UserSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      getUser();
      fetchUserSnippets();
    }
  }, [isOpen]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchUserSnippets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_snippets')
        .select(`
          *,
          profiles(display_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserSnippets(data || []);
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (snippet: UserSnippet) => {
    if (!user) return;
    
    // Record download
    await supabase
      .from('snippet_downloads')
      .insert({
        user_id: user.id,
        snippet_id: snippet.id
      });
    
    // Update local state
    setUserSnippets(prev => 
      prev.map(s => 
        s.id === snippet.id 
          ? { ...s, downloads_count: s.downloads_count + 1 }
          : s
      )
    );
  };

  const filteredOfficialSnippets = searchQuery
    ? CODE_SNIPPETS.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getSnippetsByCategory(activeCategory);

  const filteredUserSnippets = searchQuery
    ? userSnippets.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : userSnippets.filter(s => s.category === activeCategory);

  const handleCopy = async (snippet: CodeSnippet | UserSnippet, id?: string) => {
    await navigator.clipboard.writeText(snippet.code);
    setCopiedId(id || snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (snippet: CodeSnippet | UserSnippet) => {
    onInsert(snippet.code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-md border-l border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Code Snippets</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="official" className="flex-1">Official</TabsTrigger>
              <TabsTrigger value="community" className="flex-1">Community</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
            {Object.entries(SNIPPET_CATEGORIES).map(([key, { name, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span>{icon}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Snippets List */}
        <div className="overflow-y-auto h-[calc(100vh-250px)] p-4 space-y-3">
          {activeTab === 'official' ? (
            <>
              {filteredOfficialSnippets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No snippets found
                </div>
              ) : (
                filteredOfficialSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="rounded-lg border border-border bg-background overflow-hidden"
                  >
                    <div className="p-3 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{snippet.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {snippet.description}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <BookmarkButton
                            itemType="snippet"
                            itemId={snippet.id}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                          />
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {SNIPPET_CATEGORIES[snippet.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                          </span>
                        </div>
                      </div>
                    </div>
                    <pre className="p-3 text-xs bg-muted/30 overflow-x-auto max-h-32">
                      <code>{snippet.code}</code>
                    </pre>
                    <div className="flex gap-2 p-2 bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleCopy(snippet)}
                      >
                        {copiedId === snippet.id ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleInsert(snippet)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Insert
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading community snippets...
                </div>
              ) : filteredUserSnippets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No community snippets found
                </div>
              ) : (
                filteredUserSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="rounded-lg border border-border bg-background overflow-hidden"
                  >
                    <div className="p-3 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{snippet.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {snippet.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {snippet.profiles?.display_name}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {SNIPPET_CATEGORIES[snippet.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                          </span>
                        </div>
                      </div>
                      {snippet.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {snippet.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <pre className="p-3 text-xs bg-muted/30 overflow-x-auto max-h-32">
                      <code>{snippet.code}</code>
                    </pre>
                    <div className="flex gap-2 p-2 bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={async () => {
                          await handleCopy({ code: snippet.code } as any, snippet.id);
                          await handleDownload(snippet);
                        }}
                      >
                        {copiedId === snippet.id ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>📥 {snippet.downloads_count}</>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleInsert({ code: snippet.code } as any)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Insert
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
