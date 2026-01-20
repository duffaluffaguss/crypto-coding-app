import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { verifyMessage } from 'viem';
import { verifyEnsOwnership } from '@/lib/ens';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address, ensName, message, signature, avatar } = body;

    // Validate required fields
    if (!address || !ensName || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: address, ensName, message, signature' },
        { status: 400 }
      );
    }

    // Verify the signature matches the address and message
    const isValidSignature = await verifyMessage({
      address,
      message,
      signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Verify the address actually owns the ENS name
    const ownsEns = await verifyEnsOwnership(address, ensName);
    if (!ownsEns) {
      return NextResponse.json(
        { error: 'Address does not own this ENS name' },
        { status: 400 }
      );
    }

    // Check if ENS name is already verified by another user
    const { data: existingEns } = await supabase
      .from('ens_names')
      .select('user_id')
      .eq('name', ensName)
      .single();

    if (existingEns && existingEns.user_id !== user.id) {
      return NextResponse.json(
        { error: 'ENS name is already verified by another user' },
        { status: 409 }
      );
    }

    // Remove any existing ENS verification for this user (users can only have one primary ENS)
    await supabase
      .from('ens_names')
      .delete()
      .eq('user_id', user.id);

    // Store the verification
    const { data: ensRecord, error: insertError } = await supabase
      .from('ens_names')
      .insert({
        user_id: user.id,
        name: ensName,
        address: address.toLowerCase(),
        avatar: avatar || null,
        is_primary: true,
        verified_at: new Date().toISOString(),
        signature,
        message,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting ENS verification:', insertError);
      return NextResponse.json(
        { error: 'Failed to store verification' },
        { status: 500 }
      );
    }

    // Also store in verification activities table for tracking
    await supabase
      .from('verification_activities')
      .insert({
        user_id: user.id,
        verification_type: 'ens',
        platform_username: ensName,
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      id: ensRecord.id,
      name: ensName,
      avatar: avatar || null,
      verified_at: ensRecord.verified_at,
    });

  } catch (error) {
    console.error('ENS verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove ENS verification for this user
    const { error: deleteError } = await supabase
      .from('ens_names')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting ENS verification:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ENS verification removed',
    });

  } catch (error) {
    console.error('ENS verification deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}