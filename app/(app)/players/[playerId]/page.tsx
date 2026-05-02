import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { HIT_RESULTS } from '@/lib/wiffle/constants'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ playerId: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params
  const supabase = await createClient()

  const [{ data: player }, { data: battingAll }, { data: pitchingAll }] = await Promise.all([
    supabase
      .from('players')
      .select(`*, team:teams (id, name, color_hex, league:leagues (id, name, season))`)
      .eq('id', playerId)
      .single(),
    supabase.from('batting_stats').select('*').eq('player_id', playerId),
    supabase.from('pitching_stats').select('*').eq('player_id', playerId),
  ])

  if (!player) notFound()

  const batting = battingAll?.[0]
  const pitching = pitchingAll?.[0]
  const team = player.team as any
  const league = team?.league

  const { data: recentAtBats } = await supabase
    .from('at_bats')
    .select(`
      *,
      pitcher:players!at_bats_pitcher_id_fkey (id, name),
      batter:players!at_bats_batter_id_fkey (id, name),
      game:games (id, status, home_team:teams!games_home_team_id_fkey(name), away_team:teams!games_away_team_id_fkey(name))
    `)
    .eq('batter_id', playerId)
    .order('created_at', { ascending: false })
    .limit(10)

  const RESULT_LABELS: Record<string, string> = {
    single: '1B', double: '2B', triple: '3B', hr: 'HR',
    out: 'Out', k: 'K', walk: 'BB', foul_out: 'FO',
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-6 pb-5">
        {team && (
          <Link
            href={`/teams/${team.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
            {team.name}
          </Link>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div
            className="h-14 w-14 shrink-0 rounded-md flex items-center justify-center scoreboard text-lg"
            style={{
              backgroundColor: (team?.color_hex ?? '#888') + '1a',
              color: team?.color_hex ?? '#888',
            }}
            aria-hidden="true"
          >
            {player.number ?? player.name[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[1.05] truncate">{player.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {player.number != null && (
                <span className="font-mono tabular-nums">#{String(player.number).padStart(2, '0')}</span>
              )}
              {player.position && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{player.position}</span>
                </>
              )}
              {team && league && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{league.season}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {batting && Number(batting.ab) > 0 && (
          <section>
            <h2 className="eyebrow mb-3 px-1">Batting</h2>
            <div className="grid grid-cols-4 gap-2">
              <StatCell label="AVG" value={Number(batting.ba).toFixed(3).replace(/^0/, '')} highlight />
              <StatCell label="OBP" value={Number(batting.obp).toFixed(3).replace(/^0/, '')} />
              <StatCell label="SLG" value={Number(batting.slg).toFixed(3).replace(/^0/, '')} />
              <StatCell label="HR" value={String(batting.hr)} accent />
              <StatCell label="AB" value={String(batting.ab)} />
              <StatCell label="H" value={String(batting.h)} />
              <StatCell label="RBI" value={String(batting.rbi)} />
              <StatCell label="BB" value={String(batting.bb)} />
              <StatCell label="K" value={String(batting.k)} />
              <StatCell label="2B" value={String(batting['2b'])} />
              <StatCell label="3B" value={String(batting['3b'])} />
              <StatCell label="G" value={String(batting.g)} />
            </div>
          </section>
        )}

        {pitching && Number(pitching.outs_recorded) > 0 && (
          <section>
            <h2 className="eyebrow mb-3 px-1">Pitching</h2>
            <div className="grid grid-cols-4 gap-2">
              <StatCell
                label="ERA"
                value={pitching.era != null ? Number(pitching.era).toFixed(2) : '—'}
                highlight
              />
              <StatCell label="WHIP" value={pitching.whip != null ? Number(pitching.whip).toFixed(2) : '—'} />
              <StatCell label="K/9" value={pitching.k_per_9 != null ? Number(pitching.k_per_9).toFixed(1) : '—'} />
              <StatCell label="IP" value={`${pitching.ip_full}.${pitching.ip_partial}`} />
              <StatCell label="K" value={String(pitching.k)} />
              <StatCell label="BB" value={String(pitching.bb)} />
              <StatCell label="H" value={String(pitching.h)} />
              <StatCell label="ER" value={String(pitching.er)} />
            </div>
          </section>
        )}

        {recentAtBats && recentAtBats.length > 0 && (
          <section>
            <h2 className="eyebrow mb-3 px-1">Recent at-bats</h2>
            <div className="space-y-1.5">
              {recentAtBats.map((ab) => {
                const g = ab.game as any
                const matchup = g ? `${g.away_team?.name} @ ${g.home_team?.name}` : 'Game'
                const isHit = ab.result && HIT_RESULTS.includes(ab.result)
                const isHR = ab.result === 'hr'
                const isWalk = ab.result === 'walk'
                return (
                  <div
                    key={ab.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-card border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{matchup}</p>
                      <p className="text-xs text-muted-foreground truncate">vs {(ab.pitcher as any)?.name}</p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold font-mono tabular-nums px-2 py-1 rounded shrink-0',
                        isHR && 'bg-destructive text-live-foreground',
                        isHit && !isHR && 'bg-field/15 text-field',
                        isWalk && 'bg-muted text-foreground',
                        !isHit && !isWalk && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {ab.result ? RESULT_LABELS[ab.result] ?? ab.result : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCell({ label, value, highlight, accent }: { label: string; value: string; highlight?: boolean; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 bg-card border border-border rounded-md">
      <span
        className={cn(
          'scoreboard text-lg leading-none',
          highlight && 'text-foreground',
          accent && 'text-destructive'
        )}
      >
        {value}
      </span>
      <span className="text-[9.5px] text-muted-foreground font-semibold mt-1.5 uppercase tracking-[0.1em]">{label}</span>
    </div>
  )
}
