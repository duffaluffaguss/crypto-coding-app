'use client'

import React, { useRef, useCallback, useEffect } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useTheme } from 'next-themes'

interface HCaptchaWidgetProps {
  sitekey?: string
  onVerify: (token: string) => void
  onError?: (error: Error) => void
  onExpire?: () => void
  size?: 'normal' | 'compact' | 'invisible'
  theme?: 'light' | 'dark' | 'auto'
  className?: string
  disabled?: boolean
  invisible?: boolean
}

export const HCaptchaWidget: React.FC<HCaptchaWidgetProps> = ({
  sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
  onVerify,
  onError,
  onExpire,
  size = 'normal',
  theme: themeProp = 'auto',
  className,
  disabled = false,
  invisible = false
}) => {
  const captchaRef = useRef<HCaptcha>(null)
  const { theme: systemTheme } = useTheme()

  // Determine theme to use
  const resolvedTheme = themeProp === 'auto' 
    ? (systemTheme === 'dark' ? 'dark' : 'light')
    : themeProp

  const handleVerify = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  const handleError = useCallback((error: any) => {
    console.error('hCaptcha error:', error)
    onError?.(error)
  }, [onError])

  const handleExpire = useCallback(() => {
    console.warn('hCaptcha token expired')
    onExpire?.()
  }, [onExpire])

  // Reset captcha programmatically
  const resetCaptcha = useCallback(() => {
    captchaRef.current?.resetCaptcha()
  }, [])

  // Execute invisible captcha
  const executeCaptcha = useCallback(() => {
    if (invisible && captchaRef.current) {
      captchaRef.current.execute()
    }
  }, [invisible])

  // Expose methods via ref
  useEffect(() => {
    if (captchaRef.current) {
      ;(captchaRef.current as any).resetCaptcha = resetCaptcha
      ;(captchaRef.current as any).executeCaptcha = executeCaptcha
    }
  }, [resetCaptcha, executeCaptcha])

  if (!sitekey) {
    console.warn('hCaptcha site key not found. Please add NEXT_PUBLIC_HCAPTCHA_SITE_KEY to your environment variables.')
    return (
      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          CAPTCHA configuration missing. Please contact support.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <HCaptcha
        ref={captchaRef}
        sitekey={sitekey}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        size={invisible ? 'invisible' : size}
        theme={resolvedTheme}
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />
    </div>
  )
}

export default HCaptchaWidget