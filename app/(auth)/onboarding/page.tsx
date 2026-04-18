'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function OnboardingForm() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirectTo')
  const redirectTo = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/leagues'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not signed in'); setLoading(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      router.push(redirectTo)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden paper">
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
        {/* Pennant welcome header */}
        <div className="text-center mb-6 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <span className="inline-block pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.28em] uppercase font-800 px-4 py-2 pr-7">
            Rookie Card
          </span>
        </div>

        <div className="relative bg-card rounded-md border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-600 fill-mode-both">
          <div aria-hidden="true" className="stitch-rule opacity-80" />

          <div className="px-6 pt-5 pb-2">
            <h1 className="font-display font-800 text-xl tracking-[0.1em] uppercase">
              What's on the back of the card?
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your name as it'll appear in box scores and rosters.
            </p>
          </div>

          <div className="px-6 py-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="font-display text-[10px] tracking-[0.22em] uppercase font-700 text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Babe Ruth"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                variant="stitch"
                size="lg"
                className="w-full h-12 text-sm"
                disabled={loading || !fullName.trim()}
              >
                {loading ? 'Saving…' : 'Take the Field'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
