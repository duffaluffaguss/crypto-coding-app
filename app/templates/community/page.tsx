'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommunityTemplateCard } from '@/components/templates/CommunityTemplateCard';
import { SubmitTemplateModal } from '@/components/templates/SubmitTemplateModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, TrendingUp, Clock, Heart } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface CommunityTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  code: any;
  project_type: string;
  tags: string[];
  downloads: number;
  likes: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export default function CommunityTemplatesPage() {
  const { user } = useUser();
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'likes'>('newest');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const projectTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'defi', label: 'DeFi' },
    { value: 'nft', label: 'NFT' },
    { value: 'dao', label: 'DAO' },
    { value: 'token', label: 'Token' },
    { value: 'game', label: 'Game' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'utility', label: 'Utility' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedProjectType, selectedTag, sortBy]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_templates')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
      
      // Extract unique tags
      const allTags = data?.flatMap(template => template.tags) || [];
      const uniqueTags = Array.from(new Set(allTags));
      setAvailableTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load community templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by project type
    if (selectedProjectType !== 'all') {
      filtered = filtered.filter(template => template.project_type === selectedProjectType);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(template => template.tags.includes(selectedTag));
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'likes':
          return b.likes - a.likes;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleTemplateSubmitted = () => {
    setShowSubmitModal(false);
    fetchTemplates(); // Refresh the list
    toast.success('Template submitted for review!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Community Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and share templates created by the community
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowSubmitModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Submit Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Project Type Filter */}
          <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger>
              <SelectValue placeholder="Select tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Newest
                </div>
              </SelectItem>
              <SelectItem value="downloads">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Most Downloads
                </div>
              </SelectItem>
              <SelectItem value="likes">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Most Liked
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <CommunityTemplateCard
              key={template.id}
              template={template}
              onLike={() => fetchTemplates()}
              onDownload={() => fetchTemplates()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search criteria or browse all templates.
          </p>
        </div>
      )}

      {/* Submit Template Modal */}
      {showSubmitModal && (
        <SubmitTemplateModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleTemplateSubmitted}
        />
      )}
    </div>
  );
}