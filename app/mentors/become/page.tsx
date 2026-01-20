import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BecomeMentorForm } from '@/components/mentors/BecomeMentorForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Heart, Users, Award, Clock, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Become a Mentor | Zero to Crypto Dev',
  description: 'Share your crypto development knowledge and help others succeed. Become a mentor and guide the next generation of Web3 builders.',
};

export default async function BecomeMentorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/mentors/become');
  }

  // Check if user already has a mentor profile
  const { data: existingMentorProfile } = await supabase
    .from('mentor_availability')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get user's profile and completed lessons
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's completed lessons to show their expertise
  const { data: completedLessons } = await supabase
    .from('user_progress')
    .select(`
      lesson_id,
      lessons (
        title,
        project_type
      )
    `)
    .eq('user_id', user.id)
    .eq('is_completed', true);

  // Get user's deployed projects
  const { data: deployedProjects } = await supabase
    .from('projects')
    .select('name, project_type, status')
    .eq('user_id', user.id)
    .in('status', ['deployed', 'published']);

  const projectTypes = [...new Set([
    ...(completedLessons?.map(l => l.lessons?.project_type).filter(Boolean) || []),
    ...(deployedProjects?.map(p => p.project_type) || [])
  ])];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Become a Mentor</h1>
          <p className="text-xl text-gray-300">
            Share your knowledge and help others succeed in their Web3 journey
          </p>
        </div>

        {/* Existing Mentor Alert */}
        {existingMentorProfile && (
          <Alert className="bg-green-900/20 border-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-300">
              You're already a mentor! You can update your profile and availability settings below.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Why Become a Mentor?
            </CardTitle>
            <CardDescription className="text-gray-300">
              Mentoring is rewarding for both you and your mentees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Build Community</h3>
                    <p className="text-sm text-gray-400">
                      Connect with aspiring developers and help build the Web3 ecosystem
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Showcase Expertise</h3>
                    <p className="text-sm text-gray-400">
                      Demonstrate your skills and build your reputation in the community
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Learn by Teaching</h3>
                    <p className="text-sm text-gray-400">
                      Reinforce your own knowledge by explaining concepts to others
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Flexible Schedule</h3>
                    <p className="text-sm text-gray-400">
                      Set your own availability and help when it works for you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Expertise */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Expertise</CardTitle>
            <CardDescription className="text-gray-300">
              Based on your completed lessons and projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completed Lessons */}
            <div>
              <h4 className="font-semibold text-white mb-2">
                Completed Lessons ({completedLessons?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {completedLessons?.slice(0, 8).map((lesson, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-900/30 text-blue-300">
                    {lesson.lessons?.title}
                  </Badge>
                ))}
                {completedLessons && completedLessons.length > 8 && (
                  <Badge variant="outline" className="text-gray-400">
                    +{completedLessons.length - 8} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Deployed Projects */}
            <div>
              <h4 className="font-semibold text-white mb-2">
                Deployed Projects ({deployedProjects?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {deployedProjects?.map((project, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-900/30 text-green-300">
                    {project.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Project Types */}
            <div>
              <h4 className="font-semibold text-white mb-2">Project Types You Can Mentor</h4>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((type, index) => (
                  <Badge key={index} variant="outline" className="border-purple-500 text-purple-300">
                    {type?.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Check */}
        {(!completedLessons || completedLessons.length < 3) && (
          <Alert className="bg-yellow-900/20 border-yellow-500">
            <AlertDescription className="text-yellow-300">
              To become a mentor, we recommend completing at least 3 lessons to demonstrate your knowledge. 
              You currently have {completedLessons?.length || 0} completed lessons.
            </AlertDescription>
          </Alert>
        )}

        {/* Mentor Application Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {existingMentorProfile ? 'Update Mentor Profile' : 'Mentor Application'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {existingMentorProfile 
                ? 'Update your mentoring preferences and availability'
                : 'Tell us about your mentoring preferences and availability'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BecomeMentorForm 
              userId={user.id}
              existingProfile={existingMentorProfile}
              availableTopics={projectTypes}
              userProfile={profile}
            />
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Mentor Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">What mentors do:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Help mentees understand concepts and overcome challenges</li>
                <li>Review code and provide constructive feedback</li>
                <li>Share best practices and industry insights</li>
                <li>Guide mentees through project planning and implementation</li>
                <li>Provide career advice and networking opportunities</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Time commitment:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Sessions typically range from 30 minutes to 2 hours</li>
                <li>You control your availability and can set limits on mentees</li>
                <li>Most mentors help 1-5 people per month</li>
                <li>You can pause your availability anytime</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}