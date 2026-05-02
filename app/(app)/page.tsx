import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import Link from 'next/link'
import { Plus, ArrowUpRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const gameSelect = `
    *,
    home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
    away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
    league:leagues!inner (id, name, commissioner_id)
  `

  const [{ data: liveGames }, { data: upcomingGames }] = user
    ? await Promise.all([
        supabase
          .from('games')
          .select(gameSelect)
          .eq('status', 'live')
          .eq('league.commissioner_id', user.id)
          .limit(5),
        supabase
          .from('games')
          .select(gameSelect)
          .eq('status', 'scheduled')
          .eq('league.commissioner_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ])
    : [{ data: [] }, { data: [] }]

  const hasGames = (liveGames?.length ?? 0) > 0 || (upcomingGames?.length ?? 0) > 0
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-7 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{today}</p>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-none">
              Today
            </h1>
          </div>
          <Link
            href="/leagues/new"
            className="shrink-0 inline-flex items-center gap-1 h-8 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold tap hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            League
          </Link>
        </div>
      </header>

      {hasGames ? (
        <div className="pb-8">
          {(liveGames?.length ?? 0) > 0 && (
            <Section label="Live" count={liveGames!.length} live>
              <ul className="divide-y divide-border">
                {liveGames!.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game as any} showLiveBadge />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(upcomingGames?.length ?? 0) > 0 && (
            <Section label="Upcoming" count={upcomingGames!.length}>
              <ul className="divide-y divide-border">
                {upcomingGames!.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game as any} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section label="Jump to">
            <div className="px-4 grid grid-cols-2 gap-2">
              <QuickTile href="/leagues" label="Leagues" sub="Browse all" />
              <QuickTile href="/games" label="Schedule" sub="Full calendar" />
            </div>
          </Section>
        </div>
      ) : (
        <div className="px-4 pb-10 space-y-8">
          <div className="border-y border-border -mx-4 px-6 py-12 text-center space-y-4">
            <p className="eyebrow">No games scheduled</p>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">
              The season starts here.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Start a league, add your teams, and the box score writes itself.
            </p>
            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <Link
                href="/leagues/new"
                className="inline-flex items-center justify-center h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
              >
                Create league
              </Link>
              <Link
                href="/leagues"
                className="inline-flex items-center justify-center h-10 rounded-full text-foreground font-semibold text-sm tap hover:bg-muted transition-colors"
              >
                Browse leagues
              </Link>
            </div>
          </div>

          <ul className="grid grid-cols-3 divide-x divide-border border-y border-border -mx-4">
            {[
              { stat: 'Live', label: 'Pitch-by-pitch' },
              { stat: 'Auto', label: 'Standings' },
              { stat: 'Paste', label: 'Roster import' },
            ].map((f) => (
              <li
                key={f.label}
                className="flex flex-col items-center gap-1.5 py-5"
              >
                <span className="scoreboard text-lg">
                  {f.stat}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em]">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Section({
  label,
  count,
  live,
  children,
}: {
  label: string
  count?: number
  live?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="eyebrow">{label}</h2>
          {live && (
            <span
              className="block w-1.5 h-1.5 rounded-full bg-destructive"
              aria-hidden="true"
            />
          )}
        </div>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground tabular-nums font-semibold">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="px-4 border-y border-border">
        {children}
      </div>
    </section>
  )
}

function QuickTile({
  href,
  label,
  sub,
}: {
  href: string
  label: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 rounded-md bg-card border border-border tap hover:border-foreground/30 transition-colors"
    >
      <div>
        <span className="block text-[15px] font-semibold leading-tight">{label}</span>
        <span className="block text-[11px] text-muted-foreground mt-0.5">{sub}</span>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  )
}
