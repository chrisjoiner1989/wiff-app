import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const leagues = user
    ? (await supabase.from('leagues').select('id, name, season').eq('commissioner_id', user.id)).data
    : null

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Guest'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-800 tracking-tight">PROFILE</h1>
      </header>

      {/* User card */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="font-display font-700 text-xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-display text-2xl font-700 tracking-wide truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email ?? 'Not signed in'}</p>
        </div>
      </div>

      {/* Commissioner of */}
      {leagues && leagues.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">COMMISSIONER</h2>
          <div className="space-y-2">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{league.name}</p>
                  <p className="text-xs text-muted-foreground">{league.season}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="space-y-2">
        <Link
          href="/leagues/new"
          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
        >
          <span className="text-sm font-medium">Create a League</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      {user && <SignOutButton />}
      {!user && (
        <Link
          href="/login"
          className="flex items-center justify-center w-full p-3 rounded-lg border border-primary text-primary font-medium text-sm"
        >
          Sign In
        </Link>
      )}
    </div>
  )
}
