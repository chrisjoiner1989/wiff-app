import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Linescore } from '@/components/scoring/Linescore'
import { type WiffleRulesConfig, type Tables } from '@/types/database.types'
import { ChevronLeft, MapPin } from 'lucide-react'

interface Props {
  params: Promise<{ gameId: string }>
}

const RESULT_LABELS: Record<string, string> = {
  single: '1B', double: '2B', triple: '3B', hr: 'HR',
  out: 'Out', k: 'K', walk: 'BB', foul_out: 'FO', hbp: 'HBP', fc: 'FC', error: 'E',
}

export default async function GameDetailPage({ params }: Props) {
  const { gameId } = await params
  const supabase = await createClient()

  const [{ data: game }, { data: innings }, { data: atBats }] = await Promise.all([
    supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
        away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
        league:leagues (id, name, rules_config, commissioner_id)
      `)
      .eq('id', gameId)
      .single(),
    supabase.from('game_innings').select('*').eq('game_id', gameId).order('inning'),
    supabase
      .from('at_bats')
      .select(`*, batter:players!at_bats_batter_id_fkey (id, name, number), pitcher:players!at_bats_pitcher_id_fkey (id, name, number)`)
      .eq('game_id', gameId)
      .order('sequence_in_game'),
  ])

  if (!game) notFound()

  type AtBatRow = Tables<'at_bats'> & {
    batter: { id: string; name: string; number: string | null } | null
    pitcher: { id: string; name: string; number: string | null } | null
  }
  const typedAtBats = (atBats ?? []) as unknown as AtBatRow[]

  const league = game.league as { id: string; name: string; rules_config: WiffleRulesConfig; commissioner_id: string }
  const isLive = game.status === 'live'

  // Group at-bats by inning and half
  const atBatsByInning: Record<string, AtBatRow[]> = {}
  for (const ab of typedAtBats) {
    const key = `${ab.inning}-${ab.top_bottom}`
    if (!atBatsByInning[key]) atBatsByInning[key] = []
    atBatsByInning[key]!.push(ab)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <Link href={`/leagues/${league.id}`} className="text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="inline h-3 w-3" />{league.name}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-800 tracking-tight">
            {game.away_team.name} @ {game.home_team.name}
          </h1>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </Badge>
            )}
            {game.status === 'final' && <Badge variant="secondary">FINAL</Badge>}
            {game.status === 'scheduled' && (
              <Badge variant="outline">
                {new Date(game.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isLive && (
            <Link
              href={`/games/${gameId}/live`}
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium"
            >
              Watch Live
            </Link>
          )}
          {(game.status === 'scheduled' || isLive) && (
            <Link
              href={`/games/${gameId}/score`}
              className="text-xs px-3 py-1.5 rounded-md border border-primary text-primary font-medium"
            >
              Scorekeeper
            </Link>
          )}
          {game.field_location && (
            <span className="text-xs text-muted-foreground px-2 py-1.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{game.field_location}</span>
          )}
        </div>
      </header>

      {/* Score hero */}
      <div className="flex items-center justify-center gap-10 py-2">
        <ScoreBlock
          name={game.away_team.name}
          color={game.away_team.color_hex}
          score={game.away_score}
        />
        <div className="text-muted-foreground font-display text-3xl">–</div>
        <ScoreBlock
          name={game.home_team.name}
          color={game.home_team.color_hex}
          score={game.home_score}
        />
      </div>

      {/* Linescore */}
      <Linescore
        game={game}
        homeTeam={game.home_team}
        awayTeam={game.away_team}
        innings={innings ?? []}
        totalInnings={league.rules_config?.innings ?? 9}
      />

      {/* Play-by-play / box score */}
      {typedAtBats.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">PLAY BY PLAY</h2>
          <div className="space-y-3">
            {Array.from({ length: Math.max(...typedAtBats.map((ab) => ab.inning)) }, (_, i) => i + 1).map((inning) => (
              <div key={inning}>
                {(['top', 'bottom'] as const).map((half) => {
                  const halfAbs = atBatsByInning[`${inning}-${half}`]
                  if (!halfAbs?.length) return null
                  return (
                    <div key={half} className="mb-2">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        {half === 'top' ? '▲' : '▼'} {inning} —{' '}
                        {half === 'top' ? game.away_team.name : game.home_team.name}
                      </p>
                      <div className="space-y-1">
                        {halfAbs.map((ab) => (
                          <div
                            key={ab.id}
                            className="flex items-center justify-between text-sm px-3 py-1.5 rounded bg-card border border-border"
                          >
                            <span>
                              <span className="font-medium">{ab.batter?.name}</span>
                              <span className="text-muted-foreground text-xs ml-2">
                                vs {ab.pitcher?.name}
                              </span>
                            </span>
                            <span className={`text-xs font-display font-700 ${
                              ab.result && ['single','double','triple','hr'].includes(ab.result)
                                ? 'text-emerald-400'
                                : ab.result === 'walk' ? 'text-blue-400'
                                : 'text-muted-foreground'
                            }`}>
                              {ab.result ? RESULT_LABELS[ab.result] ?? ab.result : '—'}
                              {ab.rbi > 0 && ` · ${ab.rbi} RBI`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ScoreBlock({ name, color, score }: { name: string; color: string; score: number }) {
  return (
    <div className="text-center">
      <div className="w-3 h-3 rounded-sm mx-auto mb-1" style={{ backgroundColor: color }} />
      <p className="text-sm font-medium">{name}</p>
      <p className="font-display text-6xl font-800 tabular-nums leading-none">{score}</p>
    </div>
  )
}
