import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  // Recent at-bats
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
    <div className="p-4 space-y-6">
      <header className="space-y-2">
        {league && (
          <Link href={`/teams/${team.id}`} className="text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="inline h-3 w-3" />{team.name}
          </Link>
        )}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              className="font-display font-800 text-2xl"
              style={{
                backgroundColor: team?.color_hex + '33',
                color: team?.color_hex,
              }}
            >
              {player.number ?? player.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-4xl font-800 tracking-tight leading-none">{player.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {player.number && (
                <span className="text-muted-foreground text-sm">#{player.number}</span>
              )}
              {player.position && (
                <Badge variant="secondary" className="text-xs">{player.position}</Badge>
              )}
            </div>
            {team && (
              <p className="text-xs text-muted-foreground mt-1">{team.name} · {league?.season}</p>
            )}
          </div>
        </div>
      </header>

      {/* Batting stat card */}
      {batting && Number(batting.ab) > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">BATTING</h2>
          <div className="grid grid-cols-4 gap-2">
            <StatCell label="AVG" value={Number(batting.ba).toFixed(3).replace(/^0/, '')} highlight />
            <StatCell label="OBP" value={Number(batting.obp).toFixed(3).replace(/^0/, '')} />
            <StatCell label="SLG" value={Number(batting.slg).toFixed(3).replace(/^0/, '')} />
            <StatCell label="HR" value={String(batting.hr)} />
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

      {/* Pitching stat card */}
      {pitching && Number(pitching.outs_recorded) > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">PITCHING</h2>
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

      {/* Recent at-bats game log */}
      {recentAtBats && recentAtBats.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">RECENT AT-BATS</h2>
          <div className="space-y-1">
            {recentAtBats.map((ab) => {
              const g = ab.game as any
              const matchup = g ? `${g.away_team?.name} @ ${g.home_team?.name}` : 'Unknown Game'
              return (
                <div
                  key={ab.id}
                  className="flex items-center justify-between px-3 py-2 rounded bg-card border border-border text-sm"
                >
                  <div>
                    <p className="font-medium text-xs">{matchup}</p>
                    <p className="text-muted-foreground text-xs">vs {(ab.pitcher as any)?.name}</p>
                  </div>
                  <span className={`text-sm font-display font-700 ${
                    ab.result && ['single','double','triple','hr'].includes(ab.result)
                      ? 'text-emerald-400'
                      : ab.result === 'walk' ? 'text-blue-400'
                      : 'text-muted-foreground'
                  }`}>
                    {ab.result ? RESULT_LABELS[ab.result] ?? ab.result : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-card border border-border">
      <span className={`font-display font-700 text-xl tabular-nums ${highlight ? 'text-primary' : ''}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</span>
    </div>
  )
}
