import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GameCard } from '@/components/league/GameCard'
import { CalendarDays, ChevronLeft, Plus } from 'lucide-react'
import { type GameWithTeams } from '@/types/database.types'

interface Props {
  params: Promise<{ leagueId: string }>
}

export default async function SchedulePage({ params }: Props) {
  const { leagueId } = await params
  const supabase = await createClient()

  const [{ data: league }, { data: games }] = await Promise.all([
    supabase.from('leagues').select('id, name, season, commissioner_id').eq('id', leagueId).single(),
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
        away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url)
      `)
      .eq('league_id', leagueId)
      .order('scheduled_at', { ascending: true }),
  ])

  if (!league) notFound()

  const grouped: Record<string, typeof games> = {}
  for (const game of games ?? []) {
    const date = new Date(game.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    if (!grouped[date]) grouped[date] = []
    grouped[date]!.push(game)
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isCommissioner = user?.id === league.commissioner_id

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-5 pb-4">
        <Link
          href={`/leagues/${leagueId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          {league.name}
        </Link>
        <div className="flex items-end justify-between mt-2 gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{league.season}</p>
          </div>
          {isCommissioner && (
            <Link
              href={`/games/new?leagueId=${leagueId}`}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium tap hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Game
            </Link>
          )}
        </div>
      </header>

      <div className="px-4 pb-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden mt-2">
            <div className="p-8 text-center space-y-3">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold tracking-tight">No games scheduled</h2>
              {isCommissioner && (
                <Link
                  href={`/games/new?leagueId=${leagueId}`}
                  className="inline-flex items-center justify-center h-11 px-6 mt-1 rounded-lg bg-primary text-primary-foreground font-medium text-sm tap hover:bg-primary/90 transition-colors"
                >
                  Add the first game
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, dayGames]) => (
              <section key={date}>
                <h2 className="text-xs font-semibold tracking-tight text-muted-foreground mb-2 px-1">
                  {date}
                </h2>
                <div className="space-y-2">
                  {dayGames!.map((game) => (
                    <GameCard key={game.id} game={game as unknown as GameWithTeams} showLiveBadge />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
