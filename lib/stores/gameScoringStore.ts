import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { type AtBatResult, type Tables } from '@/types/database.types'

export interface BaserunnerState {
  first: string | null   // player id
  second: string | null
  third: string | null
}

export interface ScoringAction {
  type: 'at_bat'
  atBatId: string
  result: AtBatResult
  batterId: string
  pitcherId: string
  inning: number
  half: 'top' | 'bottom'
  rbi: number
  timestamp: string
}

interface GameScoringState {
  gameId: string | null
  inning: number
  half: 'top' | 'bottom'
  outs: number
  homeScore: number
  awayScore: number
  runners: BaserunnerState
  currentBatterIndex: { home: number; away: number }
  actionHistory: ScoringAction[]
  pendingAction: ScoringAction | null

  // Actions
  initGame: (game: Tables<'games'>) => void
  setCurrentBatter: (team: 'home' | 'away', index: number) => void
  recordAtBat: (action: ScoringAction) => void
  undoLastAction: () => void
  advanceInning: () => void
  setRunners: (runners: BaserunnerState) => void
  updateScore: (home: number, away: number) => void
  addOut: () => void
  resetOuts: () => void
}

export const useGameScoringStore = create<GameScoringState>()(
  immer((set) => ({
    gameId: null,
    inning: 1,
    half: 'top',
    outs: 0,
    homeScore: 0,
    awayScore: 0,
    runners: { first: null, second: null, third: null },
    currentBatterIndex: { home: 0, away: 0 },
    actionHistory: [],
    pendingAction: null,

    initGame: (game) =>
      set((state) => {
        state.gameId = game.id
        state.inning = game.current_inning
        state.half = game.current_half
        state.outs = game.outs
        state.homeScore = game.home_score
        state.awayScore = game.away_score
        state.runners = {
          first: game.runner_first,
          second: game.runner_second,
          third: game.runner_third,
        }
      }),

    setCurrentBatter: (team, index) =>
      set((state) => {
        state.currentBatterIndex[team] = index
      }),

    recordAtBat: (action) =>
      set((state) => {
        state.actionHistory.push(action)
        state.pendingAction = null
      }),

    undoLastAction: () =>
      set((state) => {
        state.actionHistory.pop()
      }),

    advanceInning: () =>
      set((state) => {
        if (state.half === 'top') {
          state.half = 'bottom'
        } else {
          state.half = 'top'
          state.inning += 1
        }
        state.outs = 0
        state.runners = { first: null, second: null, third: null }
      }),

    setRunners: (runners) =>
      set((state) => {
        state.runners = runners
      }),

    updateScore: (home, away) =>
      set((state) => {
        state.homeScore = home
        state.awayScore = away
      }),

    addOut: () =>
      set((state) => {
        state.outs = Math.min(state.outs + 1, 3)
      }),

    resetOuts: () =>
      set((state) => {
        state.outs = 0
      }),
  }))
)
