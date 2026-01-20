import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

// GET - Generate ZIP with all user data (GDPR compliant export)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zip = new JSZip();
    const exportDate = new Date().toISOString();

    // Create metadata file
    const metadata = {
      export_date: exportDate,
      user_id: user.id,
      user_email: user.email,
      format_version: '1.0',
      description: 'Your complete data export from Zero to Crypto Developer',
    };
    zip.file('export_metadata.json', JSON.stringify(metadata, null, 2));

    // 1. Profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      zip.file('profile.json', JSON.stringify({
        id: profile.id,
        display_name: profile.display_name,
        interests: profile.interests,
        experience_level: profile.experience_level,
        onboarding_completed: profile.onboarding_completed,
        current_streak: profile.current_streak,
        longest_streak: profile.longest_streak,
        last_active_date: profile.last_active_date,
        created_at: profile.created_at,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        github_url: profile.github_url,
        twitter_url: profile.twitter_url,
        website_url: profile.website_url,
      }, null, 2));
    }

    // 2. Projects data
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projects && projects.length > 0) {
      zip.file('projects.json', JSON.stringify(projects, null, 2));

      // 3. Project files (organized by project)
      const projectFilesFolder = zip.folder('project_files');
      for (const project of projects) {
        const { data: files } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', project.id);

        if (files && files.length > 0) {
          const projectFolder = projectFilesFolder?.folder(
            `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${project.id.slice(0, 8)}`
          );
          
          // Save individual source files
          for (const file of files) {
            const extension = file.file_type === 'solidity' ? '.sol' 
              : file.file_type === 'javascript' ? '.js' 
              : '.json';
            projectFolder?.file(file.filename + extension, file.content);
          }
          
          // Also save metadata
          projectFolder?.file('_file_metadata.json', JSON.stringify(files.map(f => ({
            id: f.id,
            filename: f.filename,
            file_type: f.file_type,
            is_template: f.is_template,
            updated_at: f.updated_at,
          })), null, 2));
        }
      }
    } else {
      zip.file('projects.json', JSON.stringify([], null, 2));
    }

    // 4. Learning progress
    const { data: progress } = await supabase
      .from('learning_progress')
      .select(`
        *,
        lessons (
          id,
          title,
          project_type
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    zip.file('learning_progress.json', JSON.stringify(progress || [], null, 2));

    // 5. Achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (
          name,
          description,
          icon,
          category,
          points
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    zip.file('achievements.json', JSON.stringify(achievements || [], null, 2));

    // 6. Chat messages (learning conversations)
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (chatMessages && chatMessages.length > 0) {
      // Group by project
      const messagesByProject: Record<string, typeof chatMessages> = {};
      for (const msg of chatMessages) {
        if (!messagesByProject[msg.project_id]) {
          messagesByProject[msg.project_id] = [];
        }
        messagesByProject[msg.project_id].push(msg);
      }
      zip.file('chat_messages.json', JSON.stringify(messagesByProject, null, 2));
    } else {
      zip.file('chat_messages.json', JSON.stringify({}, null, 2));
    }

    // 7. Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    zip.file('notifications.json', JSON.stringify(notifications || [], null, 2));

    // 8. Bookmarks
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    zip.file('bookmarks.json', JSON.stringify(bookmarks || [], null, 2));

    // 9. Activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    zip.file('activities.json', JSON.stringify(activities || [], null, 2));

    // 10. Feedback (if any)
    const { data: feedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    zip.file('feedback.json', JSON.stringify(feedback || [], null, 2));

    // 11. Settings/Preferences (stored in profile or local - include what we have)
    const settings = {
      email_preferences: profile?.email_preferences || null,
      note: 'Some preferences (theme, font size) are stored locally in your browser and not included here.',
    };
    zip.file('settings.json', JSON.stringify(settings, null, 2));

    // Create README for the export
    const readme = `# Your Zero to Crypto Developer Data Export

Exported on: ${new Date(exportDate).toLocaleString()}

## Contents

- **export_metadata.json** - Export information and timestamps
- **profile.json** - Your profile information
- **projects.json** - All your projects
- **project_files/** - Source code files organized by project
- **learning_progress.json** - Your lesson completion history
- **achievements.json** - Achievements you've earned
- **chat_messages.json** - Your AI tutor conversations (grouped by project)
- **notifications.json** - Your notification history
- **bookmarks.json** - Items you've bookmarked
- **activities.json** - Your activity history
- **feedback.json** - Feedback you've submitted
- **settings.json** - Your saved preferences

## Note

This export contains all data associated with your account as required by GDPR Article 20 (Right to Data Portability).

If you have any questions about this data, please contact support.
`;
    zip.file('README.md', readme);

    // Generate the ZIP file as ArrayBuffer
    const zipArrayBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Return the ZIP file
    const filename = `crypto-dev-export-${new Date().toISOString().split('T')[0]}.zip`;
    
    return new NextResponse(zipArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipArrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate data export' },
      { status: 500 }
    );
  }
}
