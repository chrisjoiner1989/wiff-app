import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { GameCard } from '@/components/league/GameCard'
import { CalendarDays, ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ leagueId: string }>
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Upcoming',
  live: 'Live',
  final: 'Final',
  postponed: 'Postponed',
}

export default async function SchedulePage({ params }: Props) {
  const { leagueId } = await params
  const supabase = await createClient()

  const [{ data: league }, { data: games }] = await Promise.all([
    supabase.from('leagues').select('id, name, season').eq('id', leagueId).single(),
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

  // Group by date
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
  const isCommissioner = league && user

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href={`/leagues/${leagueId}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="inline h-3 w-3" />{league.name}
          </Link>
          <h1 className="font-display text-3xl font-800 tracking-tight mt-1">SCHEDULE</h1>
          <p className="text-muted-foreground text-sm">{league.season}</p>
        </div>
        {isCommissioner && (
          <Link
            href={`/games/new?leagueId=${leagueId}`}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            + Game
          </Link>
        )}
      </header>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-display text-xl font-700">NO GAMES SCHEDULED</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayGames]) => (
            <section key={date}>
              <h2 className="font-display text-base font-700 tracking-wide text-muted-foreground mb-2 uppercase">
                {date}
              </h2>
              <div className="space-y-2">
                {dayGames!.map((game) => (
                  <GameCard key={game.id} game={game as any} showLiveBadge />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
