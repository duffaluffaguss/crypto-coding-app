import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

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

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user owns the project or has access
    if (project.user_id !== session.user.id) {
      // Check if user is a collaborator
      const { data: collaboration } = await supabase
        .from('collaborations')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (!collaboration) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add main project files
    if (project.solidity_code) {
      zip.file('contracts/Contract.sol', project.solidity_code);
    }

    if (project.frontend_code) {
      // Parse frontend code if it's JSON with multiple files
      try {
        const frontendFiles = JSON.parse(project.frontend_code);
        if (typeof frontendFiles === 'object') {
          Object.entries(frontendFiles).forEach(([filename, content]) => {
            zip.file(`frontend/${filename}`, content as string);
          });
        } else {
          zip.file('frontend/App.js', project.frontend_code);
        }
      } catch {
        // If not JSON, treat as single file
        zip.file('frontend/App.js', project.frontend_code);
      }
    }

    if (project.test_code) {
      zip.file('test/Contract.test.js', project.test_code);
    }

    // Add project metadata
    const projectInfo = {
      name: project.name,
      description: project.description,
      created_at: project.created_at,
      updated_at: project.updated_at,
      language: project.language || 'solidity',
      difficulty: project.difficulty,
      tags: project.tags || [],
    };

    zip.file('project.json', JSON.stringify(projectInfo, null, 2));

    // Add package.json template for frontend
    const packageJson = {
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: project.description,
      main: 'index.js',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        test: 'hardhat test',
        compile: 'hardhat compile',
      },
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        ethers: '^6.0.0',
        hardhat: '^2.22.0',
        '@nomicfoundation/hardhat-toolbox': '^4.0.0',
        '@openzeppelin/contracts': '^5.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        typescript: '^5.0.0',
      },
    };

    zip.file('package.json', JSON.stringify(packageJson, null, 2));

    // Add helpful README
    const readmeContent = `# ${project.name}

${project.description}

## Project Structure

- \`contracts/\` - Smart contracts written in Solidity
- \`frontend/\` - Frontend application files
- \`test/\` - Contract tests
- \`project.json\` - Project metadata and configuration

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Compile contracts:
   \`\`\`bash
   npm run compile
   \`\`\`

3. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

4. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Additional Setup

You may need to:
- Configure environment variables for your blockchain network
- Set up a local development blockchain (e.g., Hardhat Network)
- Install additional dependencies based on your specific requirements

## Original Project

This project was exported from the Crypto Coding App.
Original project ID: ${projectId}
Exported on: ${new Date().toISOString()}

For more advanced features and collaborative development, visit the original platform.
`;

    zip.file('README.md', readmeContent);

    // Add hardhat.config.js template
    const hardhatConfig = `require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    // Add other networks as needed
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
`;

    zip.file('hardhat.config.js', hardhatConfig);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Return ZIP file
    const fileName = `${project.name.replace(/\s+/g, '-').toLowerCase()}-export.zip`;
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export project' }, { status: 500 });
  }
}