'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={signOut}>
      Sign Out
    </Button>
  )
}
