/**
 * CAPTCHA verification utilities for hCaptcha integration
 */

interface CaptchaVerificationResult {
  success: boolean
  error?: string
  message?: string
}

/**
 * Verify a CAPTCHA token with the server
 * @param token - The CAPTCHA token to verify
 * @returns Promise with verification result
 */
export async function verifyCaptcha(token: string): Promise<CaptchaVerificationResult> {
  try {
    const response = await fetch('/api/verify/captcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'CAPTCHA verification failed'
      }
    }

    return {
      success: result.success,
      message: result.message
    }
  } catch (error) {
    console.error('CAPTCHA verification error:', error)
    return {
      success: false,
      error: 'Failed to verify CAPTCHA. Please try again.'
    }
  }
}

/**
 * Check if CAPTCHA is required based on environment
 * @returns boolean indicating if CAPTCHA should be shown
 */
export function isCaptchaEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && 
    typeof window !== 'undefined'
  )
}

/**
 * Get CAPTCHA site key from environment
 * @returns string with site key or empty string if not set
 */
export function getCaptchaSiteKey(): string {
  return process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''
}

/**
 * Validate CAPTCHA token format
 * @param token - The token to validate
 * @returns boolean indicating if token format is valid
 */
export function isValidCaptchaToken(token: string): boolean {
  // hCaptcha tokens are typically long alphanumeric strings
  return typeof token === 'string' && token.length > 20
}