import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import { CircleDot } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

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

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-800 tracking-tight text-primary">WIFF</h1>
        <p className="text-muted-foreground text-sm">Wiffle Ball League Manager</p>
      </header>

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

      {(!liveGames?.length && !upcomingGames?.length) && (
        <div className="text-center py-16 space-y-3">
          <CircleDot className="h-14 w-14 mx-auto text-muted-foreground" />
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
