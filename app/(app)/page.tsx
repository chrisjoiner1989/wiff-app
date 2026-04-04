import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import { Skeleton } from '@/components/ui/skeleton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch live games first, then upcoming
  const { data: liveGames } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
      away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
      league:leagues (id, name)
    `)
    .eq('status', 'live')
    .limit(5)

  const { data: upcomingGames } = await supabase
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
    .limit(5)

  const { data: myLeagues } = await supabase
    .from('leagues')
    .select('id, name, season')
    .eq('commissioner_id', user!.id)
    .limit(5)

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-800 tracking-tight text-primary">WIFF</h1>
        <p className="text-muted-foreground text-sm">Wiffle Ball League Manager</p>
      </header>

      {/* Live games */}
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

      {/* Upcoming */}
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

      {/* My Leagues */}
      {(myLeagues?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">MY LEAGUES</h2>
          <div className="space-y-2">
            {myLeagues!.map((league) => (
              <a
                key={league.id}
                href={`/leagues/${league.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{league.name}</p>
                  <p className="text-xs text-muted-foreground">{league.season}</p>
                </div>
                <span className="text-muted-foreground text-xs">Commissioner →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {(!liveGames?.length && !upcomingGames?.length && !myLeagues?.length) && (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">⚾</p>
          <p className="font-display text-2xl font-700 tracking-wide">PLAY BALL</p>
          <p className="text-muted-foreground text-sm">Create a league to get started.</p>
          <a href="/leagues/new" className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
            Create League
          </a>
        </div>
      )}
    </div>
  )
}
