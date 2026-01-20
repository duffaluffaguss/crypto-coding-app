import { NextRequest, NextResponse } from 'next/server'

interface HCaptchaResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  credit?: boolean
  'error-codes'?: string[]
  score?: number
  score_reason?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'CAPTCHA token is required' },
        { status: 400 }
      )
    }

    const secret = process.env.HCAPTCHA_SECRET_KEY
    if (!secret) {
      console.error('HCAPTCHA_SECRET_KEY not found in environment variables')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify the token with hCaptcha
    const verificationUrl = 'https://hcaptcha.com/siteverify'
    const verificationData = new URLSearchParams({
      secret,
      response: token,
      remoteip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    })

    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verificationData.toString(),
    })

    const verificationResult: HCaptchaResponse = await verificationResponse.json()

    if (!verificationResponse.ok) {
      console.error('hCaptcha verification failed:', verificationResult)
      return NextResponse.json(
        { success: false, error: 'CAPTCHA verification failed' },
        { status: 400 }
      )
    }

    if (verificationResult.success) {
      return NextResponse.json({
        success: true,
        message: 'CAPTCHA verified successfully',
        score: verificationResult.score,
        challenge_ts: verificationResult.challenge_ts
      })
    } else {
      console.error('hCaptcha verification failed:', verificationResult['error-codes'])
      return NextResponse.json(
        {
          success: false,
          error: 'CAPTCHA verification failed',
          errorCodes: verificationResult['error-codes']
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('CAPTCHA verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}