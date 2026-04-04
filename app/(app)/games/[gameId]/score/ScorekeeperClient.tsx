'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Linescore } from '@/components/scoring/Linescore'
import { BaserunnerDiamond } from '@/components/scoring/BaserunnerDiamond'
import { useGameScoringStore } from '@/lib/stores/gameScoringStore'
import { advanceRunners, isHit, isOut, isGameOver } from '@/lib/wiffle/rulesEngine'
import { createClient } from '@/lib/supabase/client'
import { type AtBatResult, type WiffleRulesConfig, type Tables } from '@/types/database.types'

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

const AT_BAT_BUTTONS: { label: string; result: AtBatResult; color: string }[] = [
  { label: '1B', result: 'single', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { label: '2B', result: 'double', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { label: '3B', result: 'triple', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { label: 'HR', result: 'hr', color: 'bg-yellow-600 hover:bg-yellow-500' },
  { label: 'OUT', result: 'out', color: 'bg-slate-700 hover:bg-slate-600' },
  { label: 'K', result: 'k', color: 'bg-slate-700 hover:bg-slate-600' },
  { label: 'WALK', result: 'walk', color: 'bg-blue-700 hover:bg-blue-600' },
  { label: 'FOUL OUT', result: 'foul_out', color: 'bg-slate-700 hover:bg-slate-600' },
]

export function ScorekeeperClient({ game: initialGame, lineups, innings: initialInnings }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const store = useGameScoringStore()

  const [innings, setInnings] = useState(initialInnings)
  const [saving, setSaving] = useState(false)
  const [lastAtBatId, setLastAtBatId] = useState<string | null>(null)

  const rules = initialGame.league.rules_config

  // Initialize store from server state
  useEffect(() => {
    store.initGame(initialGame)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Current team batting
  const battingTeamId =
    store.half === 'top' ? initialGame.away_team.id : initialGame.home_team.id

  const fieldingTeamId =
    store.half === 'top' ? initialGame.home_team.id : initialGame.away_team.id

  const battingTeamLineup = lineups
    .filter((l) => l.team_id === battingTeamId)
    .sort((a, b) => a.batting_order - b.batting_order)

  const pitcher = lineups.find((l) => l.team_id === fieldingTeamId && l.is_pitcher)

  const batterIndex =
    store.half === 'top'
      ? store.currentBatterIndex.away
      : store.currentBatterIndex.home

  const currentBatter = battingTeamLineup[batterIndex % battingTeamLineup.length]
  const currentTeamKey = store.half === 'top' ? 'away' : 'home'

  async function handleAtBat(result: AtBatResult) {
    if (!currentBatter || !pitcher || saving) return
    setSaving(true)

    const { newRunners, runsScored } = advanceRunners(
      result,
      store.runners,
      currentBatter.player_id,
      rules
    )

    const newHomeScore =
      store.half === 'bottom' ? store.homeScore + runsScored : store.homeScore
    const newAwayScore =
      store.half === 'top' ? store.awayScore + runsScored : store.awayScore

    const outsAdded = isOut(result) ? 1 : 0
    const newOuts = store.outs + outsAdded

    // Optimistic update
    store.updateScore(newHomeScore, newAwayScore)
    store.setRunners(newRunners)

    try {
      // Insert at_bat
      const { data: atBat, error: abError } = await supabase
        .from('at_bats')
        .insert({
          game_id: initialGame.id,
          pitcher_id: pitcher.player_id,
          batter_id: currentBatter.player_id,
          inning: store.inning,
          top_bottom: store.half,
          result,
          rbi: runsScored,
          sequence_in_game: store.actionHistory.length + 1,
        })
        .select()
        .single()

      if (abError) throw abError
      setLastAtBatId(atBat.id)

      // Upsert game_innings
      const inningUpdate = innings.find((i) => i.inning === store.inning) ?? {
        game_id: initialGame.id,
        inning: store.inning,
        home_runs: 0,
        away_runs: 0,
        home_hits: 0,
        away_hits: 0,
        home_errors: 0,
        away_errors: 0,
      }

      const updatedInning = {
        ...inningUpdate,
        home_runs: inningUpdate.home_runs + (store.half === 'bottom' ? runsScored : 0),
        away_runs: inningUpdate.away_runs + (store.half === 'top' ? runsScored : 0),
        home_hits: inningUpdate.home_hits + (store.half === 'bottom' && isHit(result) ? 1 : 0),
        away_hits: inningUpdate.away_hits + (store.half === 'top' && isHit(result) ? 1 : 0),
      }

      const { error: inningError } = await supabase
        .from('game_innings')
        .upsert(updatedInning, { onConflict: 'game_id,inning' })

      if (inningError) throw inningError

      setInnings((prev) => {
        const existing = prev.findIndex((i) => i.inning === store.inning)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = updatedInning as Tables<'game_innings'>
          return next
        }
        return [...prev, updatedInning as Tables<'game_innings'>]
      })

      const gameOver = isGameOver(newHomeScore, newAwayScore, store.inning, store.half, rules)

      // Determine if half-inning is over (3 outs)
      let gameState: Partial<Tables<'games'>> = {
        home_score: newHomeScore,
        away_score: newAwayScore,
        runner_first: newRunners.first,
        runner_second: newRunners.second,
        runner_third: newRunners.third,
        outs: newOuts,
      }

      if (gameOver) {
        gameState.status = 'final'
      } else if (newOuts >= 3) {
        // Side retired — advance half-inning
        store.advanceInning()
        store.addOut() // triggers the store, but actual advancement done above
        gameState.outs = 0
        gameState.runner_first = null
        gameState.runner_second = null
        gameState.runner_third = null

        const nextHalf = store.half === 'top' ? 'bottom' : 'top'
        const nextInning = store.half === 'bottom' ? store.inning + 1 : store.inning
        gameState.current_half = nextHalf
        gameState.current_inning = nextInning
      } else {
        store.addOut()
        // Advance batter index
        store.setCurrentBatter(
          currentTeamKey,
          (batterIndex + 1) % Math.max(battingTeamLineup.length, 1)
        )
      }

      await supabase.from('games').update(gameState).eq('id', initialGame.id)

      store.recordAtBat({
        type: 'at_bat',
        atBatId: atBat.id,
        result,
        batterId: currentBatter.player_id,
        pitcherId: pitcher.player_id,
        inning: store.inning,
        half: store.half,
        rbi: runsScored,
        timestamp: new Date().toISOString(),
      })

      if (gameOver) {
        toast.success('Game over!')
        router.push(`/games/${initialGame.id}`)
      } else if (newOuts >= 3) {
        toast.info('Side retired — next half inning')
      }
    } catch (err) {
      toast.error('Failed to save — please retry')
      // Revert optimistic updates
      store.updateScore(store.homeScore, store.awayScore)
      store.setRunners(store.runners)
    } finally {
      setSaving(false)
    }
  }

  async function handleUndo() {
    if (!lastAtBatId || saving) return
    setSaving(true)
    try {
      await supabase.from('at_bats').delete().eq('id', lastAtBatId)
      setLastAtBatId(null)
      store.undoLastAction()
      toast.info('Last action undone')
    } catch {
      toast.error('Could not undo')
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div>
          <p className="text-xs text-muted-foreground">{initialGame.league.name}</p>
          <h1 className="font-display text-lg font-700 tracking-wide">
            {initialGame.away_team.name} @ {initialGame.home_team.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={store.outs === 2 ? 'destructive' : 'secondary'}>
            {store.outs} OUT{store.outs !== 1 ? 'S' : ''}
          </Badge>
          <button
            onClick={handleUndo}
            disabled={!lastAtBatId || saving}
            className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
            aria-label="Undo last at-bat"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Linescore */}
      <div className="p-3">
        <Linescore
          game={currentGame}
          homeTeam={initialGame.home_team}
          awayTeam={initialGame.away_team}
          innings={innings}
          totalInnings={rules.innings}
        />
      </div>

      {/* Current situation */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {store.half === 'top' ? '▲' : '▼'} {store.inning} •{' '}
            {store.half === 'top' ? initialGame.away_team.name : initialGame.home_team.name} batting
          </p>
          {currentBatter && (
            <p className="font-display text-xl font-700 tracking-wide">
              #{currentBatter.player?.number} {currentBatter.player?.name}
            </p>
          )}
          {pitcher && (
            <p className="text-xs text-muted-foreground">
              vs. {pitcher.player?.name}
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

      {/* At-bat buttons */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-3">
          {AT_BAT_BUTTONS.map(({ label, result, color }) => (
            <button
              key={result}
              onClick={() => handleAtBat(result)}
              disabled={saving}
              className={`
                h-16 rounded-xl font-display text-2xl font-800 tracking-widest
                text-white transition-all active:scale-95 disabled:opacity-50
                ${color}
              `}
              aria-label={`Record ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Score display */}
        <div className="mt-4 flex justify-center items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{initialGame.away_team.name}</p>
            <p className="font-display text-5xl font-800 tabular-nums">{store.awayScore}</p>
          </div>
          <div className="text-muted-foreground text-2xl font-display">—</div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{initialGame.home_team.name}</p>
            <p className="font-display text-5xl font-800 tabular-nums">{store.homeScore}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
