import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 100;
const ALLOWED_EXTENSIONS = ['.sol', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt'];

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const projectDescription = formData.get('projectDescription') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectName?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Only ZIP files are allowed' }, { status: 400 });
    }

    // Read and parse ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    let zipContents;

    try {
      zipContents = await zip.loadAsync(arrayBuffer);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid ZIP file' }, { status: 400 });
    }

    // Extract and validate files
    const extractedFiles: { [key: string]: string } = {};
    const fileList = Object.keys(zipContents.files);

    if (fileList.length > MAX_FILES) {
      return NextResponse.json({ 
        error: `Too many files. Maximum allowed is ${MAX_FILES}` 
      }, { status: 400 });
    }

    let solidityCode = '';
    let frontendCode = '';
    let testCode = '';
    let projectMetadata: any = null;
    let hasValidFiles = false;

    // Process files
    for (const fileName of fileList) {
      const zipEntry = zipContents.files[fileName];

      // Skip directories
      if (zipEntry.dir) continue;

      // Get file extension
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      
      // Skip hidden files and non-allowed extensions
      if (fileName.startsWith('.') || fileName.includes('/.') || 
          !ALLOWED_EXTENSIONS.includes(ext)) {
        continue;
      }

      try {
        const content = await zipEntry.async('string');
        
        // Check for reasonable file size (text content)
        if (content.length > 1024 * 1024) { // 1MB per file
          continue;
        }

        extractedFiles[fileName] = content;

        // Categorize files
        if (fileName.toLowerCase().includes('contract') && ext === '.sol') {
          solidityCode = content;
          hasValidFiles = true;
        } else if (ext === '.sol') {
          // Any Solidity file
          solidityCode = content;
          hasValidFiles = true;
        } else if (fileName.toLowerCase() === 'project.json') {
          try {
            projectMetadata = JSON.parse(content);
          } catch {
            // Invalid JSON, ignore
          }
        } else if (fileName.toLowerCase().includes('test') && 
                  (ext === '.js' || ext === '.ts')) {
          testCode = content;
        } else if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
          // Frontend files - store as JSON if multiple files
          if (!frontendCode) {
            frontendCode = JSON.stringify({ [fileName]: content }, null, 2);
          } else {
            const existingFiles = JSON.parse(frontendCode);
            existingFiles[fileName] = content;
            frontendCode = JSON.stringify(existingFiles, null, 2);
          }
        }
      } catch (error) {
        // Skip files that can't be read as text
        continue;
      }
    }

    // Validate that we have at least one Solidity file
    if (!hasValidFiles || !solidityCode) {
      return NextResponse.json({ 
        error: 'No valid Solidity files found in the ZIP archive' 
      }, { status: 400 });
    }

    // Check for duplicate project name
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', projectName.trim())
      .single();

    if (existingProject) {
      return NextResponse.json({ 
        error: 'A project with this name already exists' 
      }, { status: 409 });
    }

    // Create project in database
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        name: projectName.trim(),
        description: projectDescription.trim() || projectMetadata?.description || 'Imported project',
        solidity_code: solidityCode,
        frontend_code: frontendCode || null,
        test_code: testCode || null,
        user_id: session.user.id,
        language: 'solidity',
        difficulty: projectMetadata?.difficulty || 'intermediate',
        tags: projectMetadata?.tags || ['imported'],
        is_public: false,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create project in database' 
      }, { status: 500 });
    }

    // Return success with project details
    return NextResponse.json({
      success: true,
      project: {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        filesImported: Object.keys(extractedFiles).length,
        solidityFilesFound: solidityCode ? 1 : 0,
        frontendFilesFound: frontendCode ? Object.keys(JSON.parse(frontendCode)).length : 0,
        testFilesFound: testCode ? 1 : 0
      },
      message: 'Project imported successfully'
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Failed to import project' 
    }, { status: 500 });
  }
}