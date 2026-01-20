'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { CODE_SNIPPETS, SNIPPET_CATEGORIES, getSnippetsByCategory, type CodeSnippet } from '@/lib/code-snippets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function SnippetsPage() {
  const [activeTab, setActiveTab] = useState('official');
  const [activeCategory, setActiveCategory] = useState('basics');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSnippets, setUserSnippets] = useState<UserSnippet[]>([]);
  const [mySnippets, setMySnippets] = useState<UserSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    getUser();
    fetchUserSnippets();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchUserSnippets = async () => {
    try {
      setLoading(true);
      
      // Fetch community snippets
      const { data: communityData, error: communityError } = await supabase
        .from('user_snippets')
        .select(`
          *,
          profiles(display_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (communityError) throw communityError;

      // Fetch user's own snippets
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myData, error: myError } = await supabase
          .from('user_snippets')
          .select(`
            *,
            profiles(display_name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (myError) throw myError;
        setMySnippets(myData || []);
      }

      setUserSnippets(communityData || []);
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    
    // Copy to clipboard
    await handleCopy(snippet.code, snippet.id);
  };

  const handleLike = async (snippet: UserSnippet) => {
    if (!user) return;
    
    try {
      // Toggle like
      const { data: existingLike } = await supabase
        .from('snippet_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('snippet_id', snippet.id)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('snippet_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('snippet_id', snippet.id);
        
        setUserSnippets(prev => 
          prev.map(s => 
            s.id === snippet.id 
              ? { ...s, likes_count: s.likes_count - 1 }
              : s
          )
        );
      } else {
        // Add like
        await supabase
          .from('snippet_likes')
          .insert({
            user_id: user.id,
            snippet_id: snippet.id
          });
        
        setUserSnippets(prev => 
          prev.map(s => 
            s.id === snippet.id 
              ? { ...s, likes_count: s.likes_count + 1 }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const getFilteredOfficialSnippets = () => {
    const snippets = searchQuery
      ? CODE_SNIPPETS.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : getSnippetsByCategory(activeCategory);
    
    return snippets;
  };

  const getFilteredUserSnippets = () => {
    return searchQuery
      ? userSnippets.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : userSnippets.filter(s => s.category === activeCategory);
  };

  const getFilteredMySnippets = () => {
    return searchQuery
      ? mySnippets.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : mySnippets.filter(s => s.category === activeCategory);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Code Snippets</h1>
          <p className="text-muted-foreground mt-2">
            Discover and share useful Solidity code snippets
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/snippets/submit">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Snippet
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="official">Official</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          {user && <TabsTrigger value="mine">My Snippets</TabsTrigger>}
        </TabsList>

        {/* Categories */}
        {!searchQuery && (
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {Object.entries(SNIPPET_CATEGORIES).map(([key, { name, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
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

        <TabsContent value="official" className="mt-6">
          <div className="grid gap-4">
            {getFilteredOfficialSnippets().map((snippet) => (
              <div key={snippet.id} className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{snippet.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {snippet.description}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookmarkButton
                        itemType="snippet"
                        itemId={snippet.id}
                        size="icon"
                        variant="ghost"
                      />
                      <Badge variant="secondary">
                        {SNIPPET_CATEGORIES[snippet.category]?.icon}
                      </Badge>
                    </div>
                  </div>
                </div>
                <pre className="p-4 text-sm bg-muted/30 overflow-x-auto max-h-64">
                  <code>{snippet.code}</code>
                </pre>
                <div className="p-3 bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    className="w-full"
                  >
                    {copiedId === snippet.id ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid gap-4">
              {getFilteredUserSnippets().map((snippet) => (
                <div key={snippet.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{snippet.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {snippet.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          by {snippet.profiles?.display_name}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary">
                          {SNIPPET_CATEGORIES[snippet.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                        </Badge>
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
                  <pre className="p-4 text-sm bg-muted/30 overflow-x-auto max-h-64">
                    <code>{snippet.code}</code>
                  </pre>
                  <div className="p-3 bg-muted/20 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(snippet)}
                      className="flex-1"
                    >
                      ❤️ {snippet.likes_count}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(snippet)}
                      className="flex-1"
                    >
                      {copiedId === snippet.id ? 'Copied!' : `📥 ${snippet.downloads_count}`}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="mine" className="mt-6">
            <div className="grid gap-4">
              {getFilteredMySnippets().map((snippet) => (
                <div key={snippet.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{snippet.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {snippet.description}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary">
                          {SNIPPET_CATEGORIES[snippet.category as keyof typeof SNIPPET_CATEGORIES]?.icon}
                        </Badge>
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
                  <pre className="p-4 text-sm bg-muted/30 overflow-x-auto max-h-64">
                    <code>{snippet.code}</code>
                  </pre>
                  <div className="p-3 bg-muted/20 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="flex-1"
                    >
                      ❤️ {snippet.likes_count}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(snippet.code, snippet.id)}
                      className="flex-1"
                    >
                      {copiedId === snippet.id ? 'Copied!' : `📥 ${snippet.downloads_count}`}
                    </Button>
                  </div>
                </div>
              ))}
              {getFilteredMySnippets().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No snippets yet. <Link href="/snippets/submit" className="text-primary hover:underline">Create your first snippet!</Link>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}