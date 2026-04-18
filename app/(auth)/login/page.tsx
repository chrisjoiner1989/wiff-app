'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden paper">
      {/* Scorecard grid bleed in the corners */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scorecard-grid opacity-40"
        style={{
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, black 100%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <div className="font-display font-800 text-5xl leading-none tracking-tight uppercase">
            Wiff<span className="text-stitch">.</span>
          </div>
          <div className="mt-2 font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
            Commissioner's Office
          </div>
        </div>

        <div className="relative bg-card rounded-md border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-600 fill-mode-both">
          <div aria-hidden="true" className="stitch-rule opacity-80" />

          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-display font-800 text-lg tracking-[0.14em] uppercase">
                {step === 'email' ? (isSignup ? 'Start a League' : 'Step Up') : 'Enter Code'}
              </h1>
              <span className="font-display text-[9px] tracking-[0.24em] uppercase text-muted-foreground font-700">
                {step === 'email' ? '1 / 2' : '2 / 2'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {step === 'email'
                ? 'Enter your email to run or join a wiffle ball league.'
                : <>Six-digit code sent to <span className="text-foreground font-500">{email}</span></>}
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {step === 'email' ? (
              <>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="font-display text-[10px] tracking-[0.22em] uppercase font-700 text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" variant="stitch" size="lg" className="w-full h-12 text-sm" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Code'}
                  </Button>
                </form>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
                      Or
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="lg" className="w-full h-12 text-sm" onClick={handleGoogle} type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="font-display text-[10px] tracking-[0.22em] uppercase font-700 text-muted-foreground">
                    Verification Code
                  </Label>
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
                    className="h-16 text-center text-3xl tracking-[0.5em] font-mono font-700"
                  />
                </div>
                <Button type="submit" variant="stitch" size="lg" className="w-full h-12 text-sm" disabled={loading || code.length < 6}>
                  {loading ? 'Verifying…' : 'Play Ball'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground tracking-[0.14em] text-xs"
                  type="button"
                  onClick={() => { setStep('email'); setCode('') }}
                >
                  Use a different email
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignup ? (
            <>
              Already in the league?{' '}
              <a href="/login" className="text-stitch underline underline-offset-4 font-500">
                Sign in
              </a>
            </>
          ) : (
            <>
              New to Wiff?{' '}
              <a href="/login?mode=signup" className="text-stitch underline underline-offset-4 font-500">
                Start a league
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
