'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background video — looping batting clip */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60 motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/video/hero-batting-poster.jpg"
        aria-hidden="true"
      >
        <source src="/video/hero-batting.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/70 to-neutral-950"
      />

      {/* Subtle vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"
      />

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-baseline gap-0.5">
              <span className="text-5xl font-bold tracking-tight">Wiff</span>
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 300 }}
                className="inline-block w-2.5 h-2.5 rounded-full bg-destructive mb-1"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-sm text-white/70">
              Run your wiffle ball league.
            </p>
          </motion.div>

          {/* Auth card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl bg-white/95 dark:bg-neutral-900/95 text-foreground backdrop-blur-xl shadow-2xl border border-white/10 overflow-hidden"
          >
            <div className="px-6 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight">
                  {step === 'email'
                    ? isSignup
                      ? 'Create an account'
                      : 'Sign in'
                    : 'Enter code'}
                </h1>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {step === 'email' ? '1 / 2' : '2 / 2'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'email'
                  ? 'Use your email — we\'ll send a 6-digit code.'
                  : <>Code sent to <span className="text-foreground font-medium">{email}</span></>}
              </p>
            </div>

            <div className="px-6 pb-6 pt-2">
              <AnimatePresence mode="wait" initial={false}>
                {step === 'email' ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSendCode} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium">
                          Email
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
                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? 'Sending…' : 'Send code'}
                      </Button>
                    </form>

                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white/95 dark:bg-neutral-900/95 px-2 text-xs text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} type="button">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="code-step"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleVerifyCode}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="code" className="text-xs font-medium">
                        Verification code
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        placeholder="••••••"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        required
                        autoComplete="one-time-code"
                        autoFocus
                        className="h-14 text-center text-2xl tracking-[0.4em] font-mono font-semibold"
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={loading || code.length < 6}>
                      {loading ? 'Verifying…' : 'Sign in'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      type="button"
                      onClick={() => { setStep('email'); setCode('') }}
                    >
                      Use a different email
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center text-sm text-white/70 mt-6"
          >
            {isSignup ? (
              <>
                Already have an account?{' '}
                <a href="/login" className="text-white underline underline-offset-4 font-medium">
                  Sign in
                </a>
              </>
            ) : (
              <>
                New here?{' '}
                <a href="/login?mode=signup" className="text-white underline underline-offset-4 font-medium">
                  Create an account
                </a>
              </>
            )}
          </motion.p>
        </div>
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
