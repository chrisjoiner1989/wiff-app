import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import Link from 'next/link'

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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen">
      {/* Page header — newspaper masthead */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
              {today}
            </p>
            <h1 className="font-display text-5xl font-800 tracking-tight uppercase mt-0.5 leading-none">
              Today<span className="text-stitch">.</span>
            </h1>
          </div>
          <Link
            href="/leagues/new"
            className="shrink-0 inline-flex items-center h-9 px-3 rounded-md bg-primary text-primary-foreground font-display font-700 text-xs tracking-[0.18em] uppercase hover:bg-foreground/85 transition"
          >
            + League
          </Link>
        </div>
        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />
      </header>

      {/* Game feed */}
      {hasGames ? (
        <div className="px-4 pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
          {(liveGames?.length ?? 0) > 0 && (
            <section>
              <SectionHead label="Live Now" accent="stitch" count={liveGames!.length} />
              <div className="space-y-2">
                {liveGames!.map((game) => (
                  <GameCard key={game.id} game={game as any} showLiveBadge />
                ))}
              </div>
            </section>
          )}

          {(upcomingGames?.length ?? 0) > 0 && (
            <section>
              <SectionHead label="On Deck" count={upcomingGames!.length} />
              <div className="space-y-2">
                {upcomingGames!.map((game) => (
                  <GameCard key={game.id} game={game as any} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead label="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              <QuickTile href="/leagues" label="Leagues" sub="Browse all" />
              <QuickTile href="/games" label="Schedule" sub="Full calendar" />
            </div>
          </section>
        </div>
      ) : (
        <div className="px-5 pb-10 space-y-6 animate-in fade-in duration-500 fill-mode-both">
          {/* Empty state — scorebook page */}
          <div className="relative rounded-md border border-border bg-card overflow-hidden">
            <div aria-hidden="true" className="stitch-rule opacity-80" />
            <div className="p-6 text-center space-y-3">
              <span className="inline-block pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.28em] uppercase font-800 px-3 py-1.5 pr-6">
                Opening Day
              </span>
              <h2 className="font-display text-3xl font-800 tracking-tight uppercase leading-tight">
                No games<br />on the card yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Start a league, add your teams, and the box score writes itself.
              </p>
              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <Link
                  href="/leagues/new"
                  className="inline-flex items-center justify-center h-11 rounded-md bg-stitch text-stitch-foreground font-display font-700 text-sm tracking-[0.22em] uppercase hover:bg-stitch/90 transition"
                >
                  Create League
                </Link>
                <Link
                  href="/leagues"
                  className="inline-flex items-center justify-center h-11 rounded-md bg-background ring-1 ring-border font-display font-700 text-sm tracking-[0.22em] uppercase text-foreground hover:ring-foreground/30 transition"
                >
                  Browse Leagues
                </Link>
              </div>
            </div>
          </div>

          {/* Feature strip — box score style */}
          <ul className="grid grid-cols-3 divide-x divide-border border-y border-border py-4">
            {[
              { stat: 'Live', label: 'Pitch-by-Pitch' },
              { stat: 'Auto', label: 'Standings' },
              { stat: 'Paste', label: 'Rosters' },
            ].map((f) => (
              <li key={f.label} className="flex flex-col items-center gap-1 px-2">
                <span className="font-display font-800 tabular-nums text-2xl uppercase text-stitch tracking-wide">
                  {f.stat}
                </span>
                <span className="font-display text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-700 text-center">
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

function SectionHead({
  label,
  count,
  accent,
}: {
  label: string
  count?: number
  accent?: 'stitch'
}) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`inline-block w-1 h-3.5 rounded-sm ${accent === 'stitch' ? 'bg-stitch' : 'bg-foreground'}`}
        />
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
      className="group flex flex-col justify-between h-20 p-3 rounded-md bg-card border border-border hover:border-foreground/30 hover:-translate-y-[1px] transition-all"
    >
      <span className="font-display font-800 text-base tracking-[0.14em] uppercase group-hover:text-stitch transition-colors">
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{sub}</span>
    </Link>
  )
}
