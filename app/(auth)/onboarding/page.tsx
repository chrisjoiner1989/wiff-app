'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-muted-foreground font-medium">
            Welcome to Wiff
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            What should we call you?
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className="p-6 space-y-1">
            <p className="text-sm text-muted-foreground">
              Your name as it'll appear in box scores and rosters.
            </p>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  Full name
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
                size="lg"
                className="w-full"
                disabled={loading || !fullName.trim()}
              >
                {loading ? 'Saving…' : 'Continue'}
              </Button>
            </form>
          </div>
        </motion.div>
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
