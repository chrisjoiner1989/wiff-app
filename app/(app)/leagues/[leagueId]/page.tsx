import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { StandingsTable } from '@/components/league/StandingsTable'
import { GameCard } from '@/components/league/GameCard'

interface Props {
  params: Promise<{ leagueId: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { leagueId } = await params
  const supabase = await createClient()

  const [{ data: league }, { data: standings }, { data: recentGames }] = await Promise.all([
    supabase
      .from('leagues')
      .select(`*, teams (id, name, color_hex, logo_url)`)
      .eq('id', leagueId)
      .single(),
    supabase.from('standings').select('*').eq('league_id', leagueId),
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
        away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url)
      `)
      .eq('league_id', leagueId)
      .in('status', ['live', 'final'])
      .order('scheduled_at', { ascending: false })
      .limit(5),
  ])

  if (!league) notFound()

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-800 tracking-tight">{league.name}</h1>
        <p className="text-muted-foreground text-sm">{league.season}</p>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/leagues/${leagueId}/schedule`}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
          >
            Schedule
          </Link>
          <Link
            href={`/leagues/${leagueId}/stats`}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
          >
            Stats
          </Link>
          <span className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground">
            Code: {league.join_code}
          </span>
        </div>
      </header>

      {/* Standings */}
      {standings && standings.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">STANDINGS</h2>
          <StandingsTable standings={standings} />
        </section>
      )}

      {/* Recent games */}
      {recentGames && recentGames.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">RECENT GAMES</h2>
          <div className="space-y-2">
            {recentGames.map((game) => (
              <GameCard key={game.id} game={game as any} showLiveBadge />
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      {league.teams && league.teams.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">TEAMS</h2>
          <div className="grid grid-cols-2 gap-2">
            {league.teams.map((team: any) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span
                  className="w-4 h-4 rounded-sm shrink-0"
                  style={{ backgroundColor: team.color_hex }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium truncate">{team.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
