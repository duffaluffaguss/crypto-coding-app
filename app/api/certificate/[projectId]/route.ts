import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

function generateCertificateId(projectId: string, completedAt: string): string {
  const hash = Buffer.from(`${projectId}-${completedAt}`).toString('base64').slice(0, 8);
  return `ZTCD-${hash.toUpperCase()}`;
}

// GET - Verify certificate and return data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    // Fetch project with creator info
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey (
          id,
          display_name
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found', valid: false },
        { status: 404 }
      );
    }

    // Verify project is completed (deployed or published status)
    const isCompleted = project.status === 'deployed' || project.status === 'published';
    if (!isCompleted) {
      return NextResponse.json(
        { 
          error: 'Certificate not available - project not completed', 
          valid: false,
          status: project.status
        },
        { status: 400 }
      );
    }

    // Get completion date
    const completionDate = project.deployed_at || project.created_at;
    const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate certificate ID
    const certificateId = generateCertificateId(projectId, completionDate);

    const certificateData = {
      valid: true,
      certificateId,
      projectId: project.id,
      projectName: project.name,
      projectType: project.project_type,
      userName: project.profiles?.display_name || 'Web3 Developer',
      completionDate: formattedDate,
      completionDateISO: completionDate,
      contractAddress: project.contract_address,
      network: project.network,
      isDeployed: !!project.contract_address,
    };

    return NextResponse.json(certificateData);
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate', valid: false },
      { status: 500 }
    );
  }
}

// POST - Generate certificate image (HTML rendered server-side)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    // Verify the project exists and is completed
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey (
          id,
          display_name
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isCompleted = project.status === 'deployed' || project.status === 'published';
    if (!isCompleted) {
      return NextResponse.json(
        { error: 'Certificate not available - project not completed' },
        { status: 400 }
      );
    }

    // Get completion date
    const completionDate = project.deployed_at || project.created_at;
    const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate certificate ID
    const certificateId = generateCertificateId(projectId, completionDate);
    const userName = project.profiles?.display_name || 'Web3 Developer';
    const isDeployed = !!project.contract_address;

    // Generate HTML certificate (for server-side rendering or OG image)
    const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .certificate {
      width: 800px;
      height: 566px;
      position: relative;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .gradient-border {
      position: absolute;
      inset: 0;
      padding: 3px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
      border-radius: 8px;
    }
    .inner {
      width: 100%;
      height: 100%;
      background: white;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 40px;
      text-align: center;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h1 {
      font-size: 36px;
      color: #18181b;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #71717a;
      font-size: 14px;
    }
    .user-name {
      font-size: 48px;
      font-weight: bold;
      background: linear-gradient(to right, #2563eb, #7c3aed, #db2777);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 16px 0;
    }
    .project-name {
      font-size: 28px;
      font-weight: 600;
      color: #18181b;
      margin: 16px 0 8px;
    }
    .project-type {
      display: inline-block;
      padding: 4px 12px;
      background: #f3e8ff;
      color: #7c3aed;
      border-radius: 999px;
      font-size: 14px;
    }
    .deployed-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: linear-gradient(to right, rgba(34,197,94,0.1), rgba(16,185,129,0.1));
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 999px;
      color: #16a34a;
      font-size: 14px;
      font-weight: 500;
      margin-top: 16px;
    }
    .footer {
      color: #71717a;
      font-size: 12px;
    }
    .cert-id {
      color: #a1a1aa;
      font-size: 11px;
      margin-top: 8px;
    }
    .corner {
      position: absolute;
      width: 48px;
      height: 48px;
      border: 2px solid rgba(139,92,246,0.3);
    }
    .corner-tl { top: 16px; left: 16px; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
    .corner-tr { top: 16px; right: 16px; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
    .corner-bl { bottom: 16px; left: 16px; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
    .corner-br { bottom: 16px; right: 16px; border-left: none; border-top: none; border-bottom-right-radius: 8px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="gradient-border">
      <div class="inner">
        <div>
          <div class="logo">
            <div class="logo-icon">⚡</div>
            <span class="logo-text">Zero to Crypto Dev</span>
          </div>
          <h1>Certificate of Completion</h1>
          <p class="subtitle">This certifies that</p>
        </div>
        
        <div>
          <div class="user-name">${userName}</div>
          <p style="color: #52525b; font-size: 14px;">has successfully completed the Web3 development project</p>
          <div class="project-name">${project.name}</div>
          <span class="project-type">${project.project_type.replace('_', ' ')}</span>
          ${isDeployed ? '<div class="deployed-badge">✓ Deployed to Base Network</div>' : ''}
        </div>
        
        <div class="footer">
          <p>Completed on <strong style="color: #3f3f46;">${formattedDate}</strong></p>
          <p class="cert-id">Certificate ID: ${certificateId}${isDeployed ? ` • Contract: ${project.contract_address?.slice(0, 6)}...${project.contract_address?.slice(-4)}` : ''}</p>
        </div>
      </div>
    </div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
  </div>
</body>
</html>`;

    return new NextResponse(certificateHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
