'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type Step = 'email' | 'code'

function LoginForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirectTo')
  const redirectTo =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/leagues'
  const isSignup = searchParams.get('mode') === 'signup'
  const supabase = createClient()

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: undefined },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setStep('code')
      toast.success('Code sent — check your email')
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Try 'email' type first (existing users), fall back to 'signup' (new users)
    let result = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (result.error) {
      result = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    }

    const { data, error } = result
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }

    // Check if new user needs onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user!.id)
      .single()

    if (!profile?.full_name) {
      router.push(`/onboarding?redirectTo=${redirectTo}`)
    } else {
      router.push(redirectTo)
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback?redirectTo=${redirectTo}`,
      },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image src="/icons/icon-192.png" width={80} height={80} alt="WIFF" className="rounded-2xl" />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl tracking-wide">
              {step === 'email' ? (isSignup ? 'Create Account' : 'Sign In') : 'Enter Code'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Enter your email to sign in to your wiffle ball leagues.'
                : `We sent a code to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 'email' ? (
              <>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send code'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    required
                    autoComplete="one-time-code"
                    autoFocus
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading || code.length < 6}>
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  type="button"
                  aria-label="Go back and use a different email address"
                  onClick={() => { setStep('email'); setCode('') }}
                >
                  Use a different email
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <a href="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
                Sign in
              </a>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <a href="/login?mode=signup" className="text-foreground underline underline-offset-4 hover:text-primary">
                Create one
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
