import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Linescore } from '@/components/scoring/Linescore'
import { type AtBatWithPlayers, type GameWithTeams } from '@/types/database.types'
import { RESULT_LABELS_SHORT, HIT_RESULTS } from '@/lib/wiffle/constants'
import { ChevronLeft, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ gameId: string }>
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

  const typedGame = game as unknown as GameWithTeams
  const typedAtBats = (atBats ?? []) as unknown as AtBatWithPlayers[]
  const league = typedGame.league!
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const isScheduled = game.status === 'scheduled'

  const winnerSide = isFinal && game.home_score !== game.away_score
    ? game.home_score > game.away_score ? 'home' : 'away'
    : null

  const atBatsByInning: Record<string, AtBatWithPlayers[]> = {}
  for (const ab of typedAtBats) {
    const key = `${ab.inning}-${ab.top_bottom}`
    if (!atBatsByInning[key]) atBatsByInning[key] = []
    atBatsByInning[key]!.push(ab)
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-6 pb-4">
        <Link
          href={`/leagues/${league.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
          {league.name}
        </Link>

        <div className="flex items-start justify-between mt-3 gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.025em] leading-[1.1]">
            {game.away_team.name}
            <span className="text-muted-foreground font-medium mx-1.5">at</span>
            {game.home_team.name}
          </h1>
          <div className="shrink-0 mt-1">
            {isLive && <span className="live-pill">Live</span>}
            {isFinal && (
              <span className="eyebrow">Final</span>
            )}
            {isScheduled && (
              <span className="eyebrow tabular-nums">
                {new Date(game.scheduled_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mt-4 flex-wrap items-center">
          {isLive && (
            <Link
              href={`/games/${gameId}/live`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 h-8 rounded-full bg-destructive text-live-foreground tap hover:bg-destructive/90 transition-colors"
            >
              Watch live
            </Link>
          )}
          {(isScheduled || isLive) && (
            <Link
              href={`/games/${gameId}/score`}
              className="text-[13px] font-semibold px-3.5 h-8 inline-flex items-center rounded-full bg-muted text-foreground tap hover:bg-muted/70 transition-colors"
            >
              Scorekeeper
            </Link>
          )}
          {game.field_location && (
            <span className="text-[12px] font-medium px-2 h-8 inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {game.field_location}
            </span>
          )}
        </div>
      </header>

      <div className="pb-8 space-y-8">
        {/* Scoreboard — full-bleed broadcast block */}
        <div className="bg-neutral-950 text-white">
          <div className="px-6 py-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreBlock
              name={game.away_team.name}
              color={game.away_team.color_hex}
              score={game.away_score}
              dim={winnerSide === 'home'}
              winner={winnerSide === 'away'}
              align="left"
            />
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">
              {isLive ? `${game.current_half === 'top' ? '▲' : '▼'} ${game.current_inning}` : 'vs'}
            </span>
            <ScoreBlock
              name={game.home_team.name}
              color={game.home_team.color_hex}
              score={game.home_score}
              dim={winnerSide === 'away'}
              winner={winnerSide === 'home'}
              align="right"
            />
          </div>
        </div>

        <section>
          <h2 className="eyebrow mb-2 px-4">Linescore</h2>
          <Linescore
            game={game}
            homeTeam={game.home_team}
            awayTeam={game.away_team}
            innings={innings ?? []}
            totalInnings={league.rules_config?.innings ?? 9}
          />
        </section>

        {typedAtBats.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2 px-4">Play by play</h2>
            <div className="space-y-5">
              {Array.from({ length: Math.max(...typedAtBats.map((ab) => ab.inning)) }, (_, i) => i + 1).map((inning) => (
                <div key={inning}>
                  {(['top', 'bottom'] as const).map((half) => {
                    const halfAbs = atBatsByInning[`${inning}-${half}`]
                    if (!halfAbs?.length) return null
                    const teamName = half === 'top' ? game.away_team.name : game.home_team.name
                    return (
                      <div key={half} className="mb-1">
                        <div className="flex items-center gap-2 px-4 py-1.5">
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                            {half === 'top' ? '▲' : '▼'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            {ordinal(inning)} · {teamName}
                          </span>
                          <span className="flex-1 h-px bg-border" aria-hidden="true" />
                        </div>
                        <ul className="px-4 divide-y divide-border border-y border-border">
                          {halfAbs.map((ab) => {
                            const isHit = ab.result && HIT_RESULTS.includes(ab.result)
                            const isWalk = ab.result === 'walk'
                            const isHR = ab.result === 'hr'
                            return (
                              <li
                                key={ab.id}
                                className="flex items-center justify-between gap-3 py-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-semibold truncate">
                                    {ab.batter?.name}
                                  </span>
                                  <span className="text-muted-foreground text-[11px] ml-2">
                                    vs {ab.pitcher?.name}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    'text-[11px] font-bold font-mono tabular-nums px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider',
                                    isHR && 'bg-destructive text-live-foreground',
                                    isHit && !isHR && 'bg-field/15 text-field',
                                    isWalk && 'bg-muted text-foreground',
                                    !isHit && !isWalk && 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {ab.result ? RESULT_LABELS_SHORT[ab.result] ?? ab.result : '—'}
                                  {ab.rbi > 0 && ` · ${ab.rbi}`}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ScoreBlock({
  name,
  color,
  score,
  dim,
  winner,
  align,
}: {
  name: string
  color: string
  score: number
  dim: boolean
  winner: boolean
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex flex-col min-w-0 transition-opacity',
        align === 'right' ? 'items-end text-right' : 'items-start text-left',
        dim && 'opacity-50'
      )}
    >
      <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
        <span
          className="w-1 h-4 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75 truncate max-w-[130px]">
          {name}
        </span>
      </div>
      <span
        className={cn(
          'scoreboard text-[64px] leading-none mt-2',
          winner && 'text-white',
          !winner && !dim && 'text-white/80'
        )}
      >
        {score}
      </span>
    </div>
  )
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
