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
      {/* Masthead */}
      <header className="px-5 pt-5 pb-4">
        <Link
          href={`/leagues/${league.id}`}
          className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.24em] uppercase text-muted-foreground font-700 hover:text-stitch transition"
        >
          <ChevronLeft className="h-3 w-3" />
          {league.name}
        </Link>

        <div className="flex items-baseline justify-between mt-2 gap-3">
          <h1 className="font-display text-2xl md:text-3xl font-800 tracking-tight uppercase leading-tight">
            {game.away_team.name}
            <span className="text-muted-foreground font-700 mx-2">@</span>
            {game.home_team.name}
          </h1>
          <div className="shrink-0">
            {isLive && (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stitch opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-stitch" />
                </span>
                <span className="font-display font-800 text-[10px] tracking-[0.24em] uppercase text-stitch">
                  Live
                </span>
              </span>
            )}
            {isFinal && (
              <span className="font-display text-[10px] tracking-[0.26em] uppercase font-800 text-muted-foreground">
                Final
              </span>
            )}
            {isScheduled && (
              <span className="font-display text-[10px] tracking-[0.22em] uppercase font-700 text-muted-foreground">
                {new Date(game.scheduled_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <div aria-hidden="true" className="stitch-rule mt-3 opacity-85" />

        <div className="flex gap-2 mt-4 flex-wrap">
          {isLive && (
            <Link
              href={`/games/${gameId}/live`}
              className="font-display text-[11px] tracking-[0.22em] uppercase font-700 px-3 h-9 inline-flex items-center rounded-md bg-stitch text-stitch-foreground hover:bg-stitch/90 transition"
            >
              Watch Live
            </Link>
          )}
          {(isScheduled || isLive) && (
            <Link
              href={`/games/${gameId}/score`}
              className="font-display text-[11px] tracking-[0.22em] uppercase font-700 px-3 h-9 inline-flex items-center rounded-md ring-1 ring-border hover:ring-foreground/30 hover:text-stitch transition"
            >
              Scorekeeper
            </Link>
          )}
          {game.field_location && (
            <span className="font-display text-[11px] tracking-[0.22em] uppercase font-700 px-3 h-9 inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {game.field_location}
            </span>
          )}
        </div>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Score hero — scoreboard slab */}
        <div className="relative bg-ink text-cream rounded-md overflow-hidden">
          <div aria-hidden="true" className="stitch-rule opacity-90" />
          <div className="px-5 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreBlock
              name={game.away_team.name}
              color={game.away_team.color_hex}
              score={game.away_score}
              dim={winnerSide === 'home'}
              winner={winnerSide === 'away'}
              align="left"
            />
            <span className="font-display text-[10px] tracking-[0.28em] uppercase text-cream/40 font-700">
              vs
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

        {/* Linescore */}
        <section>
          <SectionHead label="Linescore" />
          <Linescore
            game={game}
            homeTeam={game.home_team}
            awayTeam={game.away_team}
            innings={innings ?? []}
            totalInnings={league.rules_config?.innings ?? 9}
          />
        </section>

        {/* Play-by-play */}
        {typedAtBats.length > 0 && (
          <section>
            <SectionHead label="Play by Play" />
            <div className="space-y-4">
              {Array.from({ length: Math.max(...typedAtBats.map((ab) => ab.inning)) }, (_, i) => i + 1).map((inning) => (
                <div key={inning}>
                  {(['top', 'bottom'] as const).map((half) => {
                    const halfAbs = atBatsByInning[`${inning}-${half}`]
                    if (!halfAbs?.length) return null
                    const teamName = half === 'top' ? game.away_team.name : game.home_team.name
                    return (
                      <div key={half} className="mb-3">
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                            {half === 'top' ? '▲' : '▼'}
                          </span>
                          <span className="font-display text-[10px] tracking-[0.22em] uppercase font-800 text-muted-foreground">
                            {ordinal(inning)} · {teamName}
                          </span>
                          <span className="flex-1 h-px bg-border" aria-hidden="true" />
                        </div>
                        <div className="space-y-1">
                          {halfAbs.map((ab) => {
                            const isHit = ab.result && HIT_RESULTS.includes(ab.result)
                            const isWalk = ab.result === 'walk'
                            const isHR = ab.result === 'hr'
                            return (
                              <div
                                key={ab.id}
                                className={cn(
                                  'flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-card border border-border'
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-display font-700 text-sm tracking-[0.04em] uppercase truncate">
                                    {ab.batter?.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs ml-2">
                                    vs {ab.pitcher?.name}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    'font-display text-[11px] font-800 tabular-nums tracking-[0.12em] uppercase px-2 py-1 rounded shrink-0',
                                    isHR && 'bg-stitch text-stitch-foreground',
                                    isHit && !isHR && 'bg-pennant/15 text-pennant',
                                    isWalk && 'bg-brass/20 text-ink',
                                    !isHit && !isWalk && 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {ab.result ? RESULT_LABELS_SHORT[ab.result] ?? ab.result : '—'}
                                  {ab.rbi > 0 && ` · ${ab.rbi}`}
                                </span>
                              </div>
                            )
                          })}
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
          className="w-1.5 h-5 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="font-display font-700 text-xs tracking-[0.16em] uppercase text-cream/80 truncate max-w-[130px]">
          {name}
        </span>
      </div>
      <span
        className={cn(
          'font-mono tabular-nums font-700 text-[56px] leading-none mt-0.5',
          winner && 'text-stitch'
        )}
      >
        {score}
      </span>
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

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
