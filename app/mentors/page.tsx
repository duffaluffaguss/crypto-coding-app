import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MentorList } from '@/components/mentors/MentorList';
import { SearchFilters } from '@/components/mentors/SearchFilters';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Find Mentors | Zero to Crypto Dev',
  description: 'Connect with experienced crypto developers who can guide you through your Web3 journey. Get personalized help with lessons, projects, and career advice.',
};

interface PageProps {
  searchParams: {
    topic?: string;
    availability?: string;
    project_type?: string;
    search?: string;
  };
}

export default async function MentorsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Build query filters
  let query = supabase
    .from('mentor_availability')
    .select(`
      *,
      profiles:user_id (
        id,
        display_name
      )
    `)
    .eq('is_available', true)
    .lt('current_mentees', supabase.raw('max_mentees'));

  // Apply topic filter
  if (searchParams.topic) {
    query = query.contains('topics', [searchParams.topic]);
  }

  // Apply project type filter  
  if (searchParams.project_type) {
    query = query.contains('topics', [searchParams.project_type]);
  }

  const { data: availableMentors } = await query.order('created_at', { ascending: false });

  // Get mentor statistics for each mentor
  const mentorIds = availableMentors?.map(mentor => mentor.user_id) || [];
  
  let mentorStats: Record<string, { rating: number; reviewCount: number; completedSessions: number }> = {};
  
  if (mentorIds.length > 0) {
    // Get review stats
    const { data: reviewStats } = await supabase
      .from('mentor_reviews')
      .select('mentor_id, rating')
      .in('mentor_id', mentorIds)
      .eq('is_public', true);

    // Get completed session counts
    const { data: sessionStats } = await supabase
      .from('mentorship_requests')
      .select('mentor_id')
      .in('mentor_id', mentorIds)
      .eq('status', 'completed');

    // Process stats
    mentorIds.forEach(mentorId => {
      const reviews = reviewStats?.filter(r => r.mentor_id === mentorId) || [];
      const sessions = sessionStats?.filter(s => s.mentor_id === mentorId) || [];
      
      mentorStats[mentorId] = {
        rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        reviewCount: reviews.length,
        completedSessions: sessions.length
      };
    });
  }

  // Check if current user is a mentor
  let userMentorProfile = null;
  if (user) {
    const { data: mentorProfile } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    userMentorProfile = mentorProfile;
  }

  // Get user's completed lessons to suggest relevant mentors
  let userLessons: string[] = [];
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('is_completed', true);
    
    userLessons = progress?.map(p => p.lesson_id) || [];
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <h1 className="text-4xl font-bold text-white">Find Your Mentor</h1>
            {!userMentorProfile && (
              <Link href="/mentors/become">
                <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Become a Mentor
                </Button>
              </Link>
            )}
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect with experienced crypto developers who have completed the lessons you're working on. 
            Get personalized guidance, code reviews, and career advice.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {availableMentors?.length || 0}
              </div>
              <p className="text-gray-300">Available Mentors</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {Object.values(mentorStats).reduce((sum, stats) => sum + stats.completedSessions, 0)}
              </div>
              <p className="text-gray-300">Sessions Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {Object.values(mentorStats).filter(stats => stats.rating > 0).length}
              </div>
              <p className="text-gray-300">Rated Mentors</p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">How Mentorship Works</CardTitle>
            <CardDescription className="text-gray-300">
              Get personalized guidance from developers who've been where you are
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  1
                </div>
                <h3 className="font-semibold text-white">Find a Mentor</h3>
                <p className="text-sm text-gray-400">
                  Browse mentors who completed lessons you're working on or projects similar to yours
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  2
                </div>
                <h3 className="font-semibold text-white">Request Guidance</h3>
                <p className="text-sm text-gray-400">
                  Send a message explaining what you need help with and schedule a session
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  3
                </div>
                <h3 className="font-semibold text-white">Learn & Grow</h3>
                <p className="text-sm text-gray-400">
                  Get personalized help, code reviews, and accelerate your learning
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <SearchFilters 
          searchParams={searchParams}
          userLessons={userLessons}
        />

        {/* Mentor List */}
        <MentorList 
          mentors={availableMentors || []}
          mentorStats={mentorStats}
          currentUserId={user?.id}
        />

        {/* Empty State */}
        {(!availableMentors || availableMentors.length === 0) && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="text-6xl">🔍</div>
                <h3 className="text-xl font-semibold text-white">No mentors found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Try adjusting your filters or check back later. New mentors join regularly!
                </p>
                <div className="flex justify-center space-x-4 pt-4">
                  <Link href="/mentors">
                    <Button variant="outline">Clear Filters</Button>
                  </Link>
                  <Link href="/mentors/become">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Become a Mentor
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}