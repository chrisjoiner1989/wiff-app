'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { Linescore } from '@/components/scoring/Linescore'
import { BaserunnerDiamond } from '@/components/scoring/BaserunnerDiamond'
import { useGameScoringStore } from '@/lib/stores/gameScoringStore'
import { advanceRunners, isHit, isOut, isGameOver } from '@/lib/wiffle/rulesEngine'
import { createClient } from '@/lib/supabase/client'
import { type AtBatResult, type WiffleRulesConfig, type Tables } from '@/types/database.types'
import { cn } from '@/lib/utils'

type GameWithTeams = Tables<'games'> & {
  home_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  away_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  league: { id: string; name: string; rules_config: WiffleRulesConfig; commissioner_id: string }
}

type LineupEntry = Tables<'game_lineups'> & {
  player: { id: string; name: string; number: string | null; position: string | null }
}

interface Props {
  game: GameWithTeams
  lineups: LineupEntry[]
  innings: Tables<'game_innings'>[]
}

const AT_BAT_BUTTONS: {
  label: string
  result: AtBatResult
  tone: 'hit' | 'hr' | 'out' | 'walk'
}[] = [
  { label: '1B', result: 'single', tone: 'hit' },
  { label: '2B', result: 'double', tone: 'hit' },
  { label: '3B', result: 'triple', tone: 'hit' },
  { label: 'HR', result: 'hr', tone: 'hr' },
  { label: 'Out', result: 'out', tone: 'out' },
  { label: 'K', result: 'k', tone: 'out' },
  { label: 'Walk', result: 'walk', tone: 'walk' },
  { label: 'Foul out', result: 'foul_out', tone: 'out' },
]

const toneClass: Record<string, string> = {
  hit: 'bg-field/15 text-field hover:bg-field/25 border border-field/30',
  hr: 'bg-destructive text-live-foreground hover:bg-destructive/90 shadow-sm',
  out: 'bg-card text-foreground border border-border hover:border-foreground/30',
  walk: 'bg-muted text-foreground hover:bg-muted/70 border border-border',
}

export function ScorekeeperClient({ game: initialGame, lineups, innings: initialInnings }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const store = useGameScoringStore()

  const [innings, setInnings] = useState(initialInnings)
  const [saving, setSaving] = useState(false)
  const [lastAtBatId, setLastAtBatId] = useState<string | null>(null)

  const rules = initialGame.league.rules_config

  useEffect(() => {
    store.initGame(initialGame)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const battingTeamId =
    store.half === 'top' ? initialGame.away_team.id : initialGame.home_team.id

  const fieldingTeamId =
    store.half === 'top' ? initialGame.home_team.id : initialGame.away_team.id

  const battingTeamLineup = lineups
    .filter((l) => l.team_id === battingTeamId)
    .sort((a, b) => a.batting_order - b.batting_order)

  const fieldingLineup = lineups.filter((l) => l.team_id === fieldingTeamId)
  const pitcher =
    fieldingLineup.find((l) => l.is_pitcher) ?? fieldingLineup[0] ?? null

  const batterIndex =
    store.half === 'top'
      ? store.currentBatterIndex.away
      : store.currentBatterIndex.home

  const currentBatter = battingTeamLineup[batterIndex % battingTeamLineup.length] ?? null
  const currentTeamKey = store.half === 'top' ? 'away' : 'home'

  async function handleAtBat(result: AtBatResult) {
    if (saving) return
    if (!currentBatter) {
      toast.error('No batter — set the lineup first')
      return
    }
    if (!pitcher) {
      toast.error('No pitcher — set the lineup first')
      return
    }
    setSaving(true)

    const snapInning = store.inning
    const snapHalf = store.half
    const snapOuts = store.outs
    const snapHomeScore = store.homeScore
    const snapAwayScore = store.awayScore
    const snapRunners = store.runners
    const snapBatterIndex = batterIndex

    const { newRunners, runsScored } = advanceRunners(
      result,
      snapRunners,
      currentBatter.player_id,
      rules
    )

    const newHomeScore = snapHalf === 'bottom' ? snapHomeScore + runsScored : snapHomeScore
    const newAwayScore = snapHalf === 'top' ? snapAwayScore + runsScored : snapAwayScore
    const outsAdded = isOut(result) ? 1 : 0
    const newOuts = snapOuts + outsAdded
    const sideRetired = newOuts >= 3
    const gameOver = isGameOver(newHomeScore, newAwayScore, snapInning, snapHalf, rules)

    const nextHalf = snapHalf === 'top' ? 'bottom' : 'top'
    const nextInning = snapHalf === 'bottom' ? snapInning + 1 : snapInning

    try {
      const { data: atBat, error: abError } = await supabase
        .from('at_bats')
        .insert({
          game_id: initialGame.id,
          pitcher_id: pitcher.player_id,
          batter_id: currentBatter.player_id,
          inning: snapInning,
          top_bottom: snapHalf,
          result,
          rbi: runsScored,
          sequence_in_game: store.actionHistory.length + 1,
        })
        .select()
        .single()

      if (abError) throw abError
      setLastAtBatId(atBat.id)

      const existingInning = innings.find((i) => i.inning === snapInning) ?? {
        game_id: initialGame.id,
        inning: snapInning,
        home_runs: 0,
        away_runs: 0,
        home_hits: 0,
        away_hits: 0,
        home_errors: 0,
        away_errors: 0,
      }

      const updatedInning = {
        ...existingInning,
        home_runs: existingInning.home_runs + (snapHalf === 'bottom' ? runsScored : 0),
        away_runs: existingInning.away_runs + (snapHalf === 'top' ? runsScored : 0),
        home_hits: existingInning.home_hits + (snapHalf === 'bottom' && isHit(result) ? 1 : 0),
        away_hits: existingInning.away_hits + (snapHalf === 'top' && isHit(result) ? 1 : 0),
      }

      const { error: inningError } = await supabase
        .from('game_innings')
        .upsert(updatedInning, { onConflict: 'game_id,inning' })

      if (inningError) throw inningError

      setInnings((prev) => {
        const idx = prev.findIndex((i) => i.inning === snapInning)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updatedInning as Tables<'game_innings'>
          return next
        }
        return [...prev, updatedInning as Tables<'game_innings'>]
      })

      const gameState: Partial<Tables<'games'>> = {
        home_score: newHomeScore,
        away_score: newAwayScore,
        outs: sideRetired || gameOver ? 0 : newOuts,
        runner_first: sideRetired || gameOver ? null : newRunners.first,
        runner_second: sideRetired || gameOver ? null : newRunners.second,
        runner_third: sideRetired || gameOver ? null : newRunners.third,
        current_inning: sideRetired && !gameOver ? nextInning : snapInning,
        current_half: sideRetired && !gameOver ? nextHalf : snapHalf,
        status: gameOver ? 'final' : 'live',
      }

      const { error: gameError } = await supabase
        .from('games')
        .update(gameState)
        .eq('id', initialGame.id)

      if (gameError) throw gameError

      store.updateScore(newHomeScore, newAwayScore)

      if (gameOver || sideRetired) {
        store.advanceInning()
      } else {
        store.addOut()
        store.setRunners(newRunners)
        store.setCurrentBatter(
          currentTeamKey,
          (snapBatterIndex + 1) % Math.max(battingTeamLineup.length, 1)
        )
      }

      store.recordAtBat({
        type: 'at_bat',
        atBatId: atBat.id,
        result,
        batterId: currentBatter.player_id,
        pitcherId: pitcher.player_id,
        inning: snapInning,
        half: snapHalf,
        rbi: runsScored,
        timestamp: new Date().toISOString(),
      })

      if (gameOver) {
        toast.success('Game over!')
        router.push(`/games/${initialGame.id}`)
      } else if (sideRetired) {
        toast.info('Side retired — next half inning')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save — please retry')
    } finally {
      setSaving(false)
    }
  }

  async function handleUndo() {
    if (!lastAtBatId || saving) return
    setSaving(true)
    try {
      const { data: atBat } = await supabase
        .from('at_bats')
        .select('*')
        .eq('id', lastAtBatId)
        .single()

      if (!atBat) throw new Error('At-bat not found')

      await supabase.from('at_bats').delete().eq('id', lastAtBatId)

      const { data: freshGame } = await supabase
        .from('games')
        .select('*')
        .eq('id', initialGame.id)
        .single()

      if (!freshGame) throw new Error('Game not found')

      const runsToReverse = atBat.rbi ?? 0
      const wasBottom = atBat.top_bottom === 'bottom'
      const newHomeScore = freshGame.home_score - (wasBottom ? runsToReverse : 0)
      const newAwayScore = freshGame.away_score - (wasBottom ? 0 : runsToReverse)

      const wasOut = isOut(atBat.result as AtBatResult)
      const newOuts = Math.max(0, freshGame.outs - (wasOut ? 1 : 0))

      const { error: gameError } = await supabase
        .from('games')
        .update({
          home_score: newHomeScore,
          away_score: newAwayScore,
          outs: newOuts,
          current_inning: atBat.inning,
          current_half: atBat.top_bottom,
          status: 'live',
        })
        .eq('id', initialGame.id)

      if (gameError) throw gameError

      const existingInning = innings.find((i) => i.inning === atBat.inning)
      if (existingInning) {
        const wasHit = isHit(atBat.result as AtBatResult)
        const reversedInning = {
          ...existingInning,
          home_runs: Math.max(0, existingInning.home_runs - (wasBottom ? runsToReverse : 0)),
          away_runs: Math.max(0, existingInning.away_runs - (wasBottom ? 0 : runsToReverse)),
          home_hits: Math.max(0, existingInning.home_hits - (wasBottom && wasHit ? 1 : 0)),
          away_hits: Math.max(0, existingInning.away_hits - (!wasBottom && wasHit ? 1 : 0)),
        }
        await supabase
          .from('game_innings')
          .upsert(reversedInning, { onConflict: 'game_id,inning' })
        setInnings((prev) => prev.map((i) =>
          i.inning === atBat.inning ? reversedInning as Tables<'game_innings'> : i
        ))
      }

      store.updateScore(newHomeScore, newAwayScore)
      store.undoLastAction()
      setLastAtBatId(store.actionHistory.at(-2)?.atBatId ?? null)
      toast.info('Last action undone')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not undo')
    } finally {
      setSaving(false)
    }
  }

  const currentGame: Tables<'games'> = {
    ...initialGame,
    inning: store.inning,
    current_inning: store.inning,
    current_half: store.half,
    outs: store.outs,
    home_score: store.homeScore,
    away_score: store.awayScore,
    runner_first: store.runners.first,
    runner_second: store.runners.second,
    runner_third: store.runners.third,
  } as Tables<'games'>

  const lineupMissing = !currentBatter || !pitcher

  return (
    <div className="min-h-screen flex flex-col">
      {lineupMissing && (
        <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive font-medium">
            {!currentBatter && !pitcher
              ? 'No lineups set — scoring is disabled'
              : !currentBatter
              ? 'No batting lineup for this team'
              : 'No pitcher set for the fielding team'}
          </p>
          <a
            href={`/games/${initialGame.id}/lineup`}
            className="text-xs font-semibold text-destructive underline underline-offset-2 shrink-0 tap"
          >
            Set lineup
          </a>
        </div>
      )}

      <header className="bg-neutral-950 text-white overflow-hidden">
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-white/50 font-medium truncate">
              {initialGame.league.name}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center h-6 px-2 rounded-md text-[11px] font-semibold tabular-nums',
                  store.outs === 2
                    ? 'bg-destructive text-live-foreground'
                    : 'bg-white/10 text-white'
                )}
              >
                {store.outs} out{store.outs !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleUndo}
                disabled={!lastAtBatId || saving}
                className="h-8 w-8 flex items-center justify-center rounded-md ring-1 ring-white/15 text-white/70 hover:text-white hover:ring-white/30 disabled:opacity-30 transition tap"
                aria-label="Undo last at-bat"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamScore
              name={initialGame.away_team.name}
              color={initialGame.away_team.color_hex}
              score={store.awayScore}
              isBatting={store.half === 'top'}
              align="left"
            />
            <div className="flex flex-col items-center gap-1 px-2 min-w-[60px]">
              <span className="font-mono tabular-nums font-semibold text-sm text-white">
                {store.half === 'top' ? '▲' : '▼'} {ordinal(store.inning)}
              </span>
              <span className="text-[10px] tracking-wide uppercase text-white/40">
                inning
              </span>
            </div>
            <TeamScore
              name={initialGame.home_team.name}
              color={initialGame.home_team.color_hex}
              score={store.homeScore}
              isBatting={store.half === 'bottom'}
              align="right"
            />
          </div>
        </div>
      </header>

      <div className="p-3">
        <Linescore
          game={currentGame}
          homeTeam={initialGame.home_team}
          awayTeam={initialGame.away_team}
          innings={innings}
          totalInnings={rules.innings}
        />
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-4 border-y border-border bg-card/50">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            At the plate
          </p>
          {currentBatter ? (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono tabular-nums font-semibold text-destructive text-base">
                #{currentBatter.player?.number ?? '—'}
              </span>
              <span className="text-base font-semibold tracking-tight truncate">
                {currentBatter.player?.name}
              </span>
            </div>
          ) : (
            <p className="text-base font-medium text-muted-foreground mt-0.5">
              —
            </p>
          )}
          {pitcher && (
            <p className="text-xs text-muted-foreground mt-1">
              vs <span className="font-medium text-foreground">{pitcher.player?.name}</span>
            </p>
          )}
        </div>
        <BaserunnerDiamond
          first={!!store.runners.first}
          second={!!store.runners.second}
          third={!!store.runners.third}
          size="lg"
        />
      </div>

      <div className="flex-1 p-3">
        <p className="text-[11px] font-medium text-muted-foreground px-1 mb-2">
          Record the play
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {AT_BAT_BUTTONS.map(({ label, result, tone }) => (
            <button
              key={result}
              onClick={() => handleAtBat(result)}
              disabled={saving || lineupMissing}
              className={cn(
                'relative h-20 rounded-lg text-2xl font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
                toneClass[tone],
                tone === 'hr' && 'col-span-2 h-24 text-3xl'
              )}
              aria-label={`Record ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamScore({
  name,
  color,
  score,
  isBatting,
  align,
}: {
  name: string
  color: string
  score: number
  isBatting: boolean
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex flex-col min-w-0',
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      )}
    >
      <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
        <span
          className="w-[3px] h-5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-white/80 truncate max-w-[130px]">
          {name}
        </span>
        {isBatting && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0" aria-hidden="true" />
        )}
      </div>
      <span className="font-mono tabular-nums font-semibold text-[56px] leading-none mt-1 text-white">
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
