import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCertificateNFTAddress, prepareMintTransaction } from '@/lib/certificate-nft';
import type { Address } from 'viem';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pathId, walletAddress, chainId } = body;

    if (!pathId || !walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: pathId, walletAddress, chainId' },
        { status: 400 }
      );
    }

    // Verify the learning path exists
    const { data: pathData, error: pathError } = await supabase
      .from('learning_paths')
      .select(`
        id,
        name,
        slug,
        difficulty,
        learning_path_items(
          lesson_id,
          is_required
        )
      `)
      .eq('id', pathId)
      .eq('is_active', true)
      .single();

    if (pathError || !pathData) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Check user enrollment and progress
    const { data: userPath, error: enrollError } = await supabase
      .from('user_learning_paths')
      .select('progress, completed_at')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .single();

    if (enrollError || !userPath) {
      return NextResponse.json(
        { error: 'Not enrolled in this learning path' },
        { status: 403 }
      );
    }

    // Get completed lessons
    const { data: completedLessons } = await supabase
      .from('learning_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedLessonIds = new Set(completedLessons?.map(l => l.lesson_id) || []);

    // Check if all required lessons are completed
    const requiredLessonIds = pathData.learning_path_items
      ?.filter((item: any) => item.is_required)
      .map((item: any) => item.lesson_id) || [];

    const allRequiredCompleted = requiredLessonIds.every((id: string) => completedLessonIds.has(id));

    if (!allRequiredCompleted) {
      return NextResponse.json(
        { 
          error: 'Not all required lessons completed',
          completedRequired: requiredLessonIds.filter((id: string) => completedLessonIds.has(id)).length,
          totalRequired: requiredLessonIds.length,
        },
        { status: 403 }
      );
    }

    // Get user profile for certificate name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Anonymous';

    // Calculate score based on completed lessons
    const totalLessons = pathData.learning_path_items?.length || 0;
    const score = totalLessons > 0 
      ? Math.round((completedLessonIds.size / totalLessons) * 100)
      : 100;

    // Check if contract is deployed on the requested chain
    const contractAddress = getCertificateNFTAddress(chainId);
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'NFT contract not deployed on this chain' },
        { status: 400 }
      );
    }

    // Prepare transaction data for the frontend
    const txData = prepareMintTransaction(chainId, {
      to: walletAddress as Address,
      projectId: pathId,
      projectName: pathData.name,
      projectType: 'learning_path',
      score,
    });

    if (!txData) {
      return NextResponse.json(
        { error: 'Failed to prepare transaction' },
        { status: 500 }
      );
    }

    // Log the mint authorization
    await supabase
      .from('certificate_mint_logs')
      .insert({
        user_id: user.id,
        path_id: pathId,
        path_name: pathData.name,
        wallet_address: walletAddress,
        chain_id: chainId,
        score,
        status: 'authorized',
      })
      .catch(() => {
        // Table might not exist yet, ignore error
      });

    return NextResponse.json({
      authorized: true,
      pathId,
      pathName: pathData.name,
      userName,
      score,
      chainId,
      contractAddress,
      transaction: txData,
      message: 'Authorized to mint certificate',
    });

  } catch (error) {
    console.error('Certificate mint authorization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check eligibility without authorizing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    if (!pathId) {
      return NextResponse.json(
        { error: 'Missing pathId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { eligible: false, reason: 'Not authenticated' },
        { status: 200 }
      );
    }

    // Get learning path
    const { data: pathData } = await supabase
      .from('learning_paths')
      .select(`
        id,
        name,
        learning_path_items(
          lesson_id,
          is_required
        )
      `)
      .eq('id', pathId)
      .eq('is_active', true)
      .single();

    if (!pathData) {
      return NextResponse.json(
        { eligible: false, reason: 'Path not found' },
        { status: 200 }
      );
    }

    // Check enrollment
    const { data: userPath } = await supabase
      .from('user_learning_paths')
      .select('progress, completed_at')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .single();

    if (!userPath) {
      return NextResponse.json({
        eligible: false,
        reason: 'Not enrolled in path',
        pathName: pathData.name,
      });
    }

    // Get completed lessons
    const { data: completedLessons } = await supabase
      .from('learning_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedLessonIds = new Set(completedLessons?.map(l => l.lesson_id) || []);

    const requiredLessonIds = pathData.learning_path_items
      ?.filter((item: any) => item.is_required)
      .map((item: any) => item.lesson_id) || [];

    const completedRequired = requiredLessonIds.filter((id: string) => completedLessonIds.has(id)).length;
    const allRequiredCompleted = completedRequired === requiredLessonIds.length && requiredLessonIds.length > 0;

    return NextResponse.json({
      eligible: allRequiredCompleted,
      pathId,
      pathName: pathData.name,
      completedRequired,
      totalRequired: requiredLessonIds.length,
      completedLessons: completedLessonIds.size,
      totalLessons: pathData.learning_path_items?.length || 0,
      isCompleted: !!userPath.completed_at,
    });

  } catch (error) {
    console.error('Certificate eligibility check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
