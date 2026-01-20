'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Calendar, Clock, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface RequestMentorModalProps {
  mentorId: string;
  mentorName: string;
  menteeId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_TYPES = [
  { value: 'nft_marketplace', label: 'NFT Marketplace' },
  { value: 'token', label: 'Token/Coin' },
  { value: 'dao', label: 'DAO' },
  { value: 'game', label: 'Game/Gaming' },
  { value: 'social', label: 'Social Network' },
  { value: 'creator', label: 'Creator Tools' },
];

const MEETING_PREFERENCES = [
  { value: 'video_call', label: 'Video Call', description: 'Live discussion via video' },
  { value: 'text_chat', label: 'Text Chat', description: 'Async text-based help' },
  { value: 'code_review', label: 'Code Review', description: 'Review my code and provide feedback' },
  { value: 'project_help', label: 'Project Help', description: 'Help with planning or implementation' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function RequestMentorModal({ mentorId, mentorName, menteeId, isOpen, onClose }: RequestMentorModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    project_type: '',
    lesson_id: '',
    meeting_preference: '',
    estimated_duration_minutes: 60,
    urgency: 'normal' as 'low' | 'normal' | 'high',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLessons, setUserLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's current lessons when modal opens
  useEffect(() => {
    if (isOpen && menteeId) {
      loadUserLessons();
    }
  }, [isOpen, menteeId]);

  const loadUserLessons = async () => {
    try {
      const supabase = createClient();
      const { data: progress } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          is_completed,
          lessons (
            id,
            title,
            project_type
          )
        `)
        .eq('user_id', menteeId)
        .order('updated_at', { ascending: false });

      setUserLessons(progress || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim() || !formData.meeting_preference) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: mentorId,
          mentee_id: menteeId,
          lesson_id: formData.lesson_id || null,
          project_type: formData.project_type || null,
          title: formData.title.trim(),
          message: formData.message.trim(),
          meeting_preference: formData.meeting_preference,
          estimated_duration_minutes: formData.estimated_duration_minutes,
        });

      if (error) throw error;

      toast.success('Mentorship request sent successfully!');
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        project_type: '',
        lesson_id: '',
        meeting_preference: '',
        estimated_duration_minutes: 60,
        urgency: 'normal',
      });

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLessons = () => {
    return userLessons.filter(progress => !progress.is_completed).slice(0, 5);
  };

  const getRecentCompletedLessons = () => {
    return userLessons.filter(progress => progress.is_completed).slice(0, 3);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <span>Request Mentorship from {mentorName}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Send a detailed request explaining what you need help with. The more specific you are, the better they can help you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Quick Context - Current Lessons */}
          {!isLoading && getCurrentLessons().length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Currently working on:</Label>
              <div className="flex flex-wrap gap-2">
                {getCurrentLessons().map((progress) => (
                  <Button
                    key={progress.lesson_id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`text-xs ${
                      formData.lesson_id === progress.lesson_id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        lesson_id: prev.lesson_id === progress.lesson_id ? '' : progress.lesson_id,
                        project_type: progress.lessons?.project_type || '',
                        title: prev.title || `Help with: ${progress.lessons?.title}`
                      }));
                    }}
                  >
                    {progress.lessons?.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Request Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Help with smart contract deployment, Debug my NFT minting function"
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="project_type">Project Type</Label>
            <Select value={formData.project_type} onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select the type of project you're working on" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {PROJECT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-600">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Preference */}
          <div className="space-y-3">
            <Label>How would you prefer to receive help? *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEETING_PREFERENCES.map(pref => (
                <div
                  key={pref.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.meeting_preference === pref.value
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, meeting_preference: pref.value }))}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${
                      formData.meeting_preference === pref.value ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <span className="font-medium text-sm">{pref.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{pref.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration</Label>
            <Select 
              value={formData.estimated_duration_minutes.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, estimated_duration_minutes: parseInt(value) }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Detailed Description *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Explain what you're struggling with, what you've tried, and what specific help you need. Include any relevant code snippets or error messages."
              className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
              required
            />
            <p className="text-xs text-gray-400">
              Be specific about your challenge to get the best help
            </p>
          </div>

          {/* Tips for Good Requests */}
          <Alert className="bg-blue-900/20 border-blue-500">
            <AlertDescription className="text-blue-300 text-sm">
              <strong>Tips for a great request:</strong> Include your specific error messages, what you've already tried, 
              and your timeline. Mentors love helping people who show they've done their homework!
            </AlertDescription>
          </Alert>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}