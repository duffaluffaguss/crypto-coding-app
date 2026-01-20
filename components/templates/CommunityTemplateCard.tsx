'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, 
  Download, 
  Eye, 
  User, 
  Calendar, 
  Code, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CommunityTemplateCardProps {
  template: {
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
  };
  onLike?: () => void;
  onDownload?: () => void;
}

export function CommunityTemplateCard({ template, onLike, onDownload }: CommunityTemplateCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const projectTypeColors = {
    defi: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    nft: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dao: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    token: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    game: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    marketplace: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    utility: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like templates');
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('community_template_likes')
          .delete()
          .eq('template_id', template.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from('community_template_likes')
          .insert({
            template_id: template.id,
            user_id: user.id
          });

        if (error) throw error;
        setIsLiked(true);
      }

      onLike?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleUseTemplate = async () => {
    if (!user) {
      toast.error('Please login to use templates');
      return;
    }

    try {
      setIsDownloading(true);

      // Record the download
      await supabase
        .from('community_template_downloads')
        .insert({
          template_id: template.id,
          user_id: user.id
        });

      // Create a new project with this template
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `${template.name} (Copy)`,
          description: `Based on community template: ${template.name}`,
          code: template.code,
          project_type: template.project_type,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      onDownload?.();
      toast.success('Template applied to new project!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyCodeToClipboard = async (filename: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFile(filename);
      toast.success(`${filename} copied to clipboard`);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const renderCodePreview = () => {
    if (!template.code || Object.keys(template.code).length === 0) {
      return <p className="text-gray-500">No code available</p>;
    }

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(template.code).map(([filename, fileContent]) => (
          <div key={filename} className="border rounded-lg">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filename}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCodeToClipboard(filename, String(fileContent))}
                className="h-6 px-2"
              >
                {copiedFile === filename ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                {typeof fileContent === 'string' ? fileContent : JSON.stringify(fileContent, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  className={`text-xs ${projectTypeColors[template.project_type as keyof typeof projectTypeColors] || projectTypeColors.other}`}
                  variant="secondary"
                >
                  {template.project_type.toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {template.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
            {template.description}
          </p>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs px-2 py-1"
                >
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Avatar className="h-6 w-6">
              <AvatarImage src={template.profiles?.avatar_url} />
              <AvatarFallback className="text-xs">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {template.profiles?.username || 'Anonymous'}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{template.downloads}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{template.likes}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleLike}
              variant="ghost"
              size="sm"
              className={`px-3 ${isLiked ? 'text-red-600 hover:text-red-700' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              onClick={handleUseTemplate}
              disabled={isDownloading}
              size="sm"
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Code className="h-4 w-4" />
              )}
              Use
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {template.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Template Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${projectTypeColors[template.project_type as keyof typeof projectTypeColors] || projectTypeColors.other}`}>
                      {template.project_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {template.downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {template.likes}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {template.description}
                </p>
                
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Code */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Template Code</h4>
                {renderCodePreview()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button 
              onClick={handleUseTemplate} 
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Use Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}