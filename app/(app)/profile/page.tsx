import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ChevronRight } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, season')
    .eq('commissioner_id', user.id)

  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Player'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-6 pb-4">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
          Your Card
        </p>
        <h1 className="font-display text-5xl font-800 tracking-tight uppercase mt-0.5 leading-none">
          Profile<span className="text-stitch">.</span>
        </h1>
        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Rookie-card style user block */}
        <div className="relative rounded-md bg-card border border-border overflow-hidden">
          <div aria-hidden="true" className="stitch-rule opacity-80" />
          <div className="p-5 flex items-center gap-4">
            <div
              className="h-20 w-20 shrink-0 rounded-sm bg-ink text-cream flex items-center justify-center font-display font-800 text-2xl tracking-[0.04em]"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] tracking-[0.24em] uppercase text-muted-foreground font-700">
                Player
              </p>
              <p className="font-display font-800 text-xl tracking-[0.04em] uppercase truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Commissioner of */}
        {leagues && leagues.length > 0 && (
          <section>
            <SectionHead label="Commissioner of" count={leagues.length} />
            <ul className="space-y-2">
              {leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    href={`/leagues/${league.id}`}
                    className="group flex items-center justify-between p-3 rounded-md bg-card border border-border hover:border-foreground/30 hover:-translate-y-[1px] transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-700 text-sm tracking-[0.04em] uppercase truncate group-hover:text-stitch transition-colors">
                        {league.name}
                      </p>
                      <p className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-600 mt-0.5">
                        {league.season}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <SectionHead label="Actions" />
          <Link
            href="/leagues/new"
            className="group flex items-center justify-between p-3 rounded-md bg-card border border-border hover:border-foreground/30 transition"
          >
            <span className="font-display text-sm font-700 tracking-[0.04em] uppercase group-hover:text-stitch transition-colors">
              Create a League
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        <div className="pt-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function SectionHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block w-1 h-3.5 rounded-sm bg-foreground" />
        <h2 className="font-display text-xs font-800 tracking-[0.24em] uppercase">
          {label}
        </h2>
      </div>
      {count !== undefined && (
        <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
          {String(count).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}
