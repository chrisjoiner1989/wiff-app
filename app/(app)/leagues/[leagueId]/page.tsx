import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StandingsTable } from '@/components/league/StandingsTable'
import { GameCard } from '@/components/league/GameCard'
import { Plus, Settings, ChevronRight } from 'lucide-react'
import { RosterImportButton } from '@/components/league/RosterImportButton'
import { type GameWithTeams } from '@/types/database.types'

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

  const { data: { user } } = await supabase.auth.getUser()
  const isCommissioner = user?.id === league.commissioner_id

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">
              Season {league.season}
            </p>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-[1.05] break-words">
              {league.name}
            </h1>
          </div>
          {isCommissioner && (
            <Link
              href={`/leagues/${leagueId}/edit`}
              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground tap hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Edit league"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-3 inline-flex items-center gap-2">
          <span className="eyebrow">Join code</span>
          <span className="scoreboard text-sm tracking-[0.2em] text-foreground bg-muted px-2 py-1 rounded">
            {league.join_code}
          </span>
        </div>

        <div className="flex gap-1.5 mt-4">
          <Link
            href={`/leagues/${leagueId}/schedule`}
            className="text-[13px] font-semibold px-3.5 h-8 inline-flex items-center rounded-full bg-muted text-foreground tap hover:bg-muted/70 transition-colors"
          >
            Schedule
          </Link>
          <Link
            href={`/leagues/${leagueId}/stats`}
            className="text-[13px] font-semibold px-3.5 h-8 inline-flex items-center rounded-full bg-muted text-foreground tap hover:bg-muted/70 transition-colors"
          >
            Stats
          </Link>
        </div>
      </header>

      <div className="pb-8 space-y-8">
        {standings && standings.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2 px-4">Standings</h2>
            <StandingsTable standings={standings} />
          </section>
        )}

        {recentGames && recentGames.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2 px-4">Recent games</h2>
            <ul className="px-4 divide-y divide-border border-y border-border">
              {recentGames.map((game) => (
                <li key={game.id}>
                  <GameCard game={game as unknown as GameWithTeams} showLiveBadge />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-2 px-4">
            <h2 className="eyebrow">Teams</h2>
            {isCommissioner && (
              <div className="flex items-center gap-1">
                <RosterImportButton leagueId={leagueId} />
                <Link
                  href={`/leagues/${leagueId}/teams/new`}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold tap text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                  Add
                </Link>
              </div>
            )}
          </div>
          {!league.teams?.length ? (
            <div className="border-y border-border px-6 py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No teams yet
              </p>
              {isCommissioner && (
                <Link
                  href={`/leagues/${leagueId}/teams/new`}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Add first team
                </Link>
              )}
            </div>
          ) : (
            <ul className="px-4 divide-y divide-border border-y border-border">
              {league.teams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="group flex items-center gap-3 py-3.5 -mx-4 px-4 row-hover tap"
                  >
                    <span
                      className="w-1 h-5 rounded-sm shrink-0"
                      style={{ backgroundColor: team.color_hex }}
                      aria-hidden="true"
                    />
                    <span className="text-[15px] font-semibold truncate flex-1 leading-tight">
                      {team.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
