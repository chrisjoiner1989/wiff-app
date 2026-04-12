import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import Link from 'next/link'
import WiffIcon from '@/assets/wiff-icon.svg'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: liveGames }, { data: upcomingGames }] = await Promise.all([
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
        away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
        league:leagues (id, name)
      `)
      .eq('status', 'live')
      .limit(5),
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
        away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
        league:leagues (id, name)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5),
  ])

  const hasGames = (liveGames?.length ?? 0) > 0 || (upcomingGames?.length ?? 0) > 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center px-6 pt-16 pb-12 overflow-hidden">
        {/* Animated ring 1 */}
        <div
          className="absolute w-72 h-72 rounded-full border border-primary/10 animate-[spin_18s_linear_infinite]"
          aria-hidden="true"
        />
        {/* Animated ring 2 */}
        <div
          className="absolute w-52 h-52 rounded-full border border-primary/15 animate-[spin_12s_linear_infinite_reverse]"
          aria-hidden="true"
        />
        {/* Animated ring 3 */}
        <div
          className="absolute w-36 h-36 rounded-full border border-primary/20 animate-[spin_8s_linear_infinite]"
          aria-hidden="true"
        />

        {/* Glow behind icon */}
        <div
          className="absolute w-32 h-32 rounded-full bg-primary/10 blur-2xl animate-pulse"
          aria-hidden="true"
        />

        {/* Icon */}
        <div className="relative animate-in fade-in zoom-in-75 duration-700 fill-mode-both">
          <WiffIcon
            className="w-24 h-24 drop-shadow-[0_0_24px_oklch(0.82_0.18_85/0.4)]"
            width={undefined}
            height={undefined}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <div className="relative mt-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
          <h1 className="font-display text-6xl font-800 tracking-tight text-primary leading-none">
            WIFF
          </h1>
          <p className="font-display text-lg font-700 tracking-widest text-muted-foreground mt-1 uppercase">
            Wiffle Ball League Manager
          </p>
        </div>

        {/* Divider dots */}
        <div className="relative flex items-center gap-1.5 mt-6 animate-in fade-in duration-500 delay-300 fill-mode-both">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="w-1 h-1 rounded-full bg-primary/40" />
        </div>

        {/* Welcome message */}
        {user && (
          <p className="relative mt-4 text-sm text-muted-foreground animate-in fade-in duration-500 delay-500 fill-mode-both">
            Welcome back
          </p>
        )}

        {/* CTA buttons — shown when no games */}
        {!hasGames && (
          <div className="relative mt-8 flex flex-col gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
            <Link
              href="/leagues/new"
              className="flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl font-display font-700 text-lg tracking-wide hover:opacity-90 transition-opacity"
            >
              CREATE LEAGUE
            </Link>
            <Link
              href="/leagues"
              className="flex items-center justify-center h-12 bg-card border border-border rounded-xl font-display font-700 text-base tracking-wide text-foreground hover:border-primary/50 transition-colors"
            >
              VIEW LEAGUES
            </Link>
          </div>
        )}
      </div>

      {/* Game feed */}
      {hasGames && (
        <div className="flex-1 px-4 pb-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          {(liveGames?.length ?? 0) > 0 && (
            <section>
              <h2 className="font-display text-xl font-700 tracking-wide mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                LIVE NOW
              </h2>
              <div className="space-y-2">
                {liveGames!.map((game) => (
                  <GameCard key={game.id} game={game as any} showLiveBadge />
                ))}
              </div>
            </section>
          )}

          {(upcomingGames?.length ?? 0) > 0 && (
            <section>
              <h2 className="font-display text-xl font-700 tracking-wide mb-3">UPCOMING</h2>
              <div className="space-y-2">
                {upcomingGames!.map((game) => (
                  <GameCard key={game.id} game={game as any} />
                ))}
              </div>
            </section>
          )}

          {/* Quick actions below game feed */}
          <section>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/leagues"
                className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span className="font-display font-700 text-sm tracking-wide">LEAGUES</span>
                <span className="text-xs text-muted-foreground">Browse all</span>
              </Link>
              <Link
                href="/games"
                className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span className="font-display font-700 text-sm tracking-wide">GAMES</span>
                <span className="text-xs text-muted-foreground">Full schedule</span>
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* No games empty state — extra content below hero */}
      {!hasGames && (
        <div className="flex-1 px-4 pb-4 animate-in fade-in duration-500 delay-700 fill-mode-both">
          {/* Feature pills */}
          <div className="space-y-2 max-w-xs mx-auto">
            {[
              { label: 'Live Scoring', sub: 'Track every at-bat in real time' },
              { label: 'Standings', sub: 'Auto-updated after every game' },
              { label: 'Roster Import', sub: 'Paste or scan your lineup' },
            ].map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                style={{ animationDelay: `${700 + i * 100}ms` }}
              >
                <span className="w-1.5 h-6 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-display font-700 text-sm tracking-wide">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
