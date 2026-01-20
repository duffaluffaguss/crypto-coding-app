'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, X, DollarSign, Clock, Users, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';

interface BecomeMentorFormProps {
  userId: string;
  existingProfile?: any;
  availableTopics: string[];
  userProfile: any;
}

const PROJECT_TYPES = [
  { value: 'nft_marketplace', label: 'NFT Marketplace' },
  { value: 'token', label: 'Token/Coin' },
  { value: 'dao', label: 'DAO' },
  { value: 'game', label: 'Game/Gaming' },
  { value: 'social', label: 'Social Network' },
  { value: 'creator', label: 'Creator Tools' },
  { value: 'defi', label: 'DeFi' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

const MEETING_TIMES = [
  { value: 'weekday_morning', label: 'Weekday Mornings' },
  { value: 'weekday_afternoon', label: 'Weekday Afternoons' },
  { value: 'weekday_evening', label: 'Weekday Evenings' },
  { value: 'weekend_morning', label: 'Weekend Mornings' },
  { value: 'weekend_afternoon', label: 'Weekend Afternoons' },
  { value: 'weekend_evening', label: 'Weekend Evenings' },
  { value: 'flexible', label: 'Flexible/On Demand' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver', 
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export function BecomeMentorForm({ userId, existingProfile, availableTopics, userProfile }: BecomeMentorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    is_available: existingProfile?.is_available ?? true,
    topics: existingProfile?.topics ?? availableTopics.slice(0, 3),
    max_mentees: existingProfile?.max_mentees ?? 3,
    bio: existingProfile?.bio ?? '',
    hourly_rate: existingProfile?.hourly_rate ?? null,
    timezone: existingProfile?.timezone ?? 'UTC',
    preferred_meeting_times: existingProfile?.preferred_meeting_times ?? ['flexible'],
  });

  const [newTopic, setNewTopic] = useState('');
  const [showCustomTopic, setShowCustomTopic] = useState(false);

  const addTopic = (topic: string) => {
    if (!formData.topics.includes(topic)) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
    }
  };

  const removeTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const addCustomTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      addTopic(newTopic.trim().toLowerCase().replace(/\s+/g, '_'));
      setNewTopic('');
      setShowCustomTopic(false);
    }
  };

  const toggleMeetingTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_meeting_times: prev.preferred_meeting_times.includes(time)
        ? prev.preferred_meeting_times.filter(t => t !== time)
        : [...prev.preferred_meeting_times, time]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.topics.length === 0) {
      toast.error('Please select at least one topic you can help with');
      return;
    }

    if (formData.preferred_meeting_times.length === 0) {
      toast.error('Please select at least one preferred meeting time');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const mentorData = {
        user_id: userId,
        is_available: formData.is_available,
        topics: formData.topics,
        max_mentees: formData.max_mentees,
        bio: formData.bio.trim() || null,
        hourly_rate: formData.hourly_rate || null,
        timezone: formData.timezone,
        preferred_meeting_times: formData.preferred_meeting_times,
      };

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('mentor_availability')
          .update(mentorData)
          .eq('user_id', userId);
      } else {
        // Create new profile
        result = await supabase
          .from('mentor_availability')
          .insert(mentorData);
      }

      if (result.error) throw result.error;

      toast.success(existingProfile ? 'Mentor profile updated!' : 'Welcome to our mentor community!');
      
      // Redirect to mentors page
      router.push('/mentors');

    } catch (error) {
      console.error('Error saving mentor profile:', error);
      toast.error('Failed to save mentor profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTopicDisplay = (topic: string) => {
    return topic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Availability Toggle */}
      <Card className="bg-gray-700/50 border-gray-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-white">Available for Mentoring</h3>
              <p className="text-sm text-gray-400">
                Turn this off to pause accepting new mentorship requests
              </p>
            </div>
            <Switch
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Topics Section */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold text-white">Topics You Can Help With</Label>
        <p className="text-sm text-gray-400">
          Select areas where you have experience and can provide guidance
        </p>
        
        {/* Available Topics */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Project Types:</h4>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map(type => (
                <Button
                  key={type.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs ${
                    formData.topics.includes(type.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    if (formData.topics.includes(type.value)) {
                      removeTopic(type.value);
                    } else {
                      addTopic(type.value);
                    }
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Topics Display */}
          {formData.topics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Your Selected Topics:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.topics.map(topic => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="bg-green-900/30 text-green-300 flex items-center space-x-1"
                  >
                    <span>{formatTopicDisplay(topic)}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-green-100"
                      onClick={() => removeTopic(topic)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Topic Input */}
          <div>
            {!showCustomTopic ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomTopic(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Topic
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Smart Contract Security"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                />
                <Button type="button" onClick={addCustomTopic} size="sm" className="bg-blue-600">
                  Add
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowCustomTopic(false); setNewTopic(''); }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capacity Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="max_mentees" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Maximum Mentees</span>
          </Label>
          <Input
            id="max_mentees"
            type="number"
            min="1"
            max="20"
            value={formData.max_mentees}
            onChange={(e) => setFormData(prev => ({ ...prev, max_mentees: parseInt(e.target.value) || 1 }))}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            How many mentees you can actively help at once
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourly_rate" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Hourly Rate (Optional)</span>
          </Label>
          <Input
            id="hourly_rate"
            type="number"
            min="0"
            step="0.01"
            value={formData.hourly_rate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="Leave blank for free"
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Leave blank if you mentor for free
          </p>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Timezone</span>
        </Label>
        <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {TIMEZONES.map(tz => (
              <SelectItem key={tz} value={tz} className="text-white hover:bg-gray-600">
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preferred Meeting Times */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-white">Preferred Meeting Times</Label>
        <p className="text-sm text-gray-400">When are you typically available for mentorship sessions?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MEETING_TIMES.map(time => (
            <div
              key={time.value}
              className={`p-3 rounded border cursor-pointer transition-colors text-sm ${
                formData.preferred_meeting_times.includes(time.value)
                  ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => toggleMeetingTime(time.value)}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  formData.preferred_meeting_times.includes(time.value) ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <span>{time.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio & Introduction</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell potential mentees about your experience, what you enjoy helping with, and your mentoring style..."
          className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
        />
        <p className="text-xs text-gray-400">
          A good bio helps mentees understand if you're a good fit for their needs
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-700">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {existingProfile ? 'Updating Profile...' : 'Creating Profile...'}
            </>
          ) : (
            <>
              {existingProfile ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Mentor Profile
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Become a Mentor
                </>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Success Message for Updates */}
      {existingProfile && (
        <Alert className="bg-green-900/20 border-green-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-300">
            Your mentor profile is active! You can update your settings anytime.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}