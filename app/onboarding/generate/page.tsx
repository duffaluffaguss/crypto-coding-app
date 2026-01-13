'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { INTERESTS, type GeneratedProject, type ExperienceLevel } from '@/types';

export default function GeneratePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<GeneratedProject | null>(null);
  const [creating, setCreating] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);

  useEffect(() => {
    // Get data from previous steps
    const storedInterests = sessionStorage.getItem('onboarding_interests');
    const storedExperience = sessionStorage.getItem('onboarding_experience');

    if (!storedInterests || !storedExperience) {
      router.push('/onboarding/interests');
      return;
    }

    const parsedInterests = JSON.parse(storedInterests);
    setInterests(parsedInterests);
    setExperience(storedExperience as ExperienceLevel);

    generateProjects(parsedInterests);
  }, [router]);

  const generateProjects = async (userInterests: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: userInterests.map((id) =>
            INTERESTS.find((i) => i.id === id)?.label || id
          ),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate projects');
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError('Failed to generate project ideas. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: GeneratedProject) => {
    setSelectedProject(project);
    setCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update profile with interests and experience
      await supabase
        .from('profiles')
        .update({
          interests,
          experience_level: experience,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      // Create the project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: project.name,
          description: project.description,
          project_type: project.type,
          status: 'draft',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Redirect to the project IDE
      router.push(`/projects/${newProject.id}`);
    } catch (err) {
      setError('Failed to create project. Please try again.');
      setCreating(false);
      console.error(err);
    }
  };

  const getProjectTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      nft_marketplace: 'shopping-bag',
      token: 'coins',
      dao: 'users',
      game: 'gamepad-2',
      social: 'share-2',
    };
    return icons[type] || 'code';
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Creating Your Perfect Project...</h1>
          <p className="text-muted-foreground">
            Our AI is designing personalized Web3 projects based on your interests.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className="w-8 h-2 rounded-full bg-primary" />
          <div className="w-8 h-2 rounded-full bg-primary" />
          <div className="w-8 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
          <p className="text-destructive">{error}</p>
        </div>
        <Button onClick={() => generateProjects(interests)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Project</h1>
        <p className="text-muted-foreground">
          Based on your interests, here are 3 personalized Web3 project ideas.
          <br />
          Pick one to start building today!
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {projects.map((project, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedProject === project ? 'ring-2 ring-primary border-primary' : ''
            }`}
            onClick={() => !creating && setSelectedProject(project)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.type.replace('_', ' ').toUpperCase()}
                  </CardDescription>
                </div>
                {selectedProject === project && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{project.description}</p>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>How it connects to you:</strong>
                </p>
                <p className="text-sm">{project.realWorldUse}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Monetization path:</strong>
                </p>
                <p className="text-sm text-primary">{project.monetizationPath}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push('/onboarding/experience')}
          disabled={creating}
        >
          <svg
            className="mr-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </Button>
        <Button
          size="lg"
          onClick={() => selectedProject && handleSelectProject(selectedProject)}
          disabled={!selectedProject || creating}
        >
          {creating ? (
            <>
              <svg
                className="mr-2 w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </>
          ) : (
            <>
              Start Building
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-8 h-2 rounded-full bg-primary" />
        <div className="w-8 h-2 rounded-full bg-primary" />
        <div className="w-8 h-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
