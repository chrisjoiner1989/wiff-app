import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GameCard } from '@/components/league/GameCard'
import { CircleDot } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GamesPage() {
  const supabase = await createClient()

  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
      away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
      league:leagues (id, name)
    `)
    .order('scheduled_at', { ascending: false })
    .limit(30)

  const live = games?.filter((g) => g.status === 'live') ?? []
  const upcoming = games?.filter((g) => g.status === 'scheduled') ?? []
  const completed = games?.filter((g) => g.status === 'final') ?? []

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-4xl font-800 tracking-tight">GAMES</h1>
          <p className="text-muted-foreground text-sm">All games</p>
        </div>
        <Link
          href="/games/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          + Game
        </Link>
      </header>

      {live.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            LIVE
          </h2>
          <div className="space-y-2">
            {live.map((g) => <GameCard key={g.id} game={g as any} showLiveBadge />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">UPCOMING</h2>
          <div className="space-y-2">
            {upcoming.map((g) => <GameCard key={g.id} game={g as any} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">COMPLETED</h2>
          <div className="space-y-2">
            {completed.slice(0, 10).map((g) => <GameCard key={g.id} game={g as any} />)}
          </div>
        </section>
      )}

      {!games?.length && (
        <div className="text-center py-16 space-y-3">
          <CircleDot className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="font-display text-2xl font-700 tracking-wide">NO GAMES YET</p>
          <Link
            href="/games/new"
            className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
          >
            Schedule a Game
          </Link>
        </div>
      )}
    </div>
  )
}
