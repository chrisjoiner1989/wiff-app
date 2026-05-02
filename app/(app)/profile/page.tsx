import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
      <header className="px-4 pt-7 pb-6">
        <p className="eyebrow">Account</p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-none">
          Profile
        </h1>
      </header>

      <div className="pb-8 space-y-8">
        <div className="border-y border-border px-4 py-5 flex items-center gap-4">
          <div
            className="h-14 w-14 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-base tracking-tight"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold truncate leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {user.email}
            </p>
          </div>
        </div>

        {leagues && leagues.length > 0 && (
          <Section label="Commissioner" count={leagues.length}>
            <ul className="px-4 divide-y divide-border border-y border-border">
              {leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    href={`/leagues/${league.id}`}
                    className="group flex items-center justify-between py-3.5 -mx-4 px-4 row-hover tap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {league.name}
                      </p>
                      <p className="eyebrow mt-1.5">
                        {league.season}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section label="Appearance">
          <div className="border-y border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </Section>

        <Section label="Actions">
          <ul className="px-4 divide-y divide-border border-y border-border">
            <li>
              <Link
                href="/leagues/new"
                className="group flex items-center justify-between py-3.5 -mx-4 px-4 row-hover tap"
              >
                <span className="text-sm font-semibold">
                  Create a league
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          </ul>
        </Section>

        <div className="px-4 pt-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function Section({
  label,
  count,
  children,
}: {
  label: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="eyebrow">{label}</h2>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground tabular-nums font-semibold">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
