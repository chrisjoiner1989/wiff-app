import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StandingsTable } from '@/components/league/StandingsTable'
import { GameCard } from '@/components/league/GameCard'
import { Plus, Settings } from 'lucide-react'
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
      {/* Masthead */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-700">
              {league.season}
            </p>
            <h1 className="font-display text-4xl font-800 tracking-tight uppercase mt-0.5 leading-[0.95] break-words">
              {league.name}<span className="text-stitch">.</span>
            </h1>
          </div>
          {isCommissioner && (
            <Link
              href={`/leagues/${leagueId}/edit`}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md ring-1 ring-border hover:ring-foreground/30 transition"
              aria-label="Edit league"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Stitch rule + pennant code badge */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 stitch-rule opacity-85" aria-hidden="true" />
          <span className="pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.24em] uppercase font-800 px-3 py-1.5 pr-5">
            Code {league.join_code}
          </span>
        </div>

        {/* Tab-style nav pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Link
            href={`/leagues/${leagueId}/schedule`}
            className="font-display text-[11px] tracking-[0.2em] uppercase font-700 px-3 py-1.5 rounded-md ring-1 ring-border hover:ring-foreground/30 hover:text-stitch transition"
          >
            Schedule
          </Link>
          <Link
            href={`/leagues/${leagueId}/stats`}
            className="font-display text-[11px] tracking-[0.2em] uppercase font-700 px-3 py-1.5 rounded-md ring-1 ring-border hover:ring-foreground/30 hover:text-stitch transition"
          >
            Stats
          </Link>
        </div>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Standings */}
        {standings && standings.length > 0 && (
          <section>
            <SectionHead label="Standings" />
            <StandingsTable standings={standings} />
          </section>
        )}

        {/* Recent games */}
        {recentGames && recentGames.length > 0 && (
          <section>
            <SectionHead label="Recent Games" />
            <div className="space-y-2">
              {recentGames.map((game) => (
                <GameCard key={game.id} game={game as unknown as GameWithTeams} showLiveBadge />
              ))}
            </div>
          </section>
        )}

        {/* Teams */}
        <section>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block w-1 h-3.5 rounded-sm bg-foreground" />
              <h2 className="font-display text-xs font-800 tracking-[0.24em] uppercase">
                Teams
              </h2>
            </div>
            {isCommissioner && (
              <div className="flex items-center gap-2">
                <RosterImportButton leagueId={leagueId} />
                <Link
                  href={`/leagues/${leagueId}/teams/new`}
                  className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.2em] uppercase font-700 px-2.5 py-1.5 rounded-md ring-1 ring-border hover:ring-foreground/30 transition"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add
                </Link>
              </div>
            )}
          </div>
          {!league.teams?.length ? (
            <div className="text-center py-10 px-6 space-y-3 rounded-md border border-dashed border-border bg-card/60">
              <p className="font-display text-sm tracking-[0.18em] uppercase text-muted-foreground font-700">
                No teams yet
              </p>
              {isCommissioner && (
                <Link
                  href={`/leagues/${leagueId}/teams/new`}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-md bg-stitch text-stitch-foreground font-display font-700 text-xs tracking-[0.22em] uppercase hover:bg-stitch/90 transition"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add First Team
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {league.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group flex items-center gap-2.5 p-3 rounded-md bg-card border border-border hover:border-foreground/30 hover:-translate-y-[1px] transition-all"
                >
                  <span
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: team.color_hex }}
                    aria-hidden="true"
                  />
                  <span className="font-display text-sm font-700 tracking-[0.04em] uppercase truncate group-hover:text-stitch transition-colors">
                    {team.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <span aria-hidden="true" className="inline-block w-1 h-3.5 rounded-sm bg-foreground" />
      <h2 className="font-display text-xs font-800 tracking-[0.24em] uppercase">
        {label}
      </h2>
    </div>
  )
}
