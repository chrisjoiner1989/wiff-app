import { type AtBatResult, type WiffleRulesConfig } from '@/types/database.types'
import { type BaserunnerState } from '@/lib/stores/gameScoringStore'

export const DEFAULT_RULES: WiffleRulesConfig = {
  innings: 9,
  ghost_runners: true,
  courtesy_runners_allowed: true,
  strike_zone_type: 'mat',
  foul_ball_outs: true,
  foul_balls_for_out: 3,
  max_runs_per_inning: null,
  mercy_rule_runs: 10,
  mercy_rule_after_inning: 5,
  pitching_distance_ft: 45,
  no_leading_off: true,
  no_stealing: true,
  one_pitch_rule: false,
}

export interface AtBatOutcome {
  result: AtBatResult
  outsAdded: number
  rbi: number
  newRunners: BaserunnerState
  runsScored: number
}

/**
 * Advance runners based on at-bat result. Returns new baserunner state and runs scored.
 * Ghost runner logic: bases advance automatically on hits (no physical runner required).
 */
export function advanceRunners(
  result: AtBatResult,
  runners: BaserunnerState,
  batterId: string,
  rules: WiffleRulesConfig
): { newRunners: BaserunnerState; runsScored: number } {
  const { first, second, third } = runners
  let runsScored = 0
  let newRunners: BaserunnerState = { first: null, second: null, third: null }

  switch (result) {
    case 'single':
      // All runners advance 1 base (ghost runner rule: advance on contact)
      if (third) runsScored++
      if (rules.ghost_runners) {
        if (second) runsScored++ // advance 2 on single with ghost runners
        newRunners = { first: batterId, second: first, third: null }
      } else {
        newRunners = { first: batterId, second: first, third: second }
        if (third) runsScored++
      }
      break

    case 'double':
      if (third) runsScored++
      if (second) runsScored++
      if (rules.ghost_runners && first) runsScored++
      else if (first) newRunners.third = first
      newRunners.second = batterId
      break

    case 'triple':
      if (third) runsScored++
      if (second) runsScored++
      if (first) runsScored++
      newRunners = { first: null, second: null, third: batterId }
      break

    case 'hr':
      runsScored = 1 // batter
      if (first) runsScored++
      if (second) runsScored++
      if (third) runsScored++
      newRunners = { first: null, second: null, third: null }
      break

    case 'walk':
    case 'hbp':
      // Force advances only
      if (first && second && third) {
        runsScored++
        newRunners = { first: batterId, second: first, third: second }
      } else if (first && second) {
        newRunners = { first: batterId, second: first, third: second }
      } else if (first) {
        newRunners = { first: batterId, second: first, third }
      } else {
        newRunners = { first: batterId, second, third }
      }
      break

    case 'out':
    case 'k':
    case 'foul_out':
    case 'fc':
    case 'error':
      // Runners hold (simplified — FC/errors can be customized later)
      newRunners = { ...runners }
      break
  }

  return { newRunners, runsScored }
}

export function isHit(result: AtBatResult): boolean {
  return ['single', 'double', 'triple', 'hr'].includes(result)
}

export function isOut(result: AtBatResult): boolean {
  return ['out', 'k', 'foul_out'].includes(result)
}

export function checkMercyRule(
  leadingScore: number,
  trailingScore: number,
  inning: number,
  rules: WiffleRulesConfig
): boolean {
  if (!rules.mercy_rule_runs || !rules.mercy_rule_after_inning) return false
  return (
    inning >= rules.mercy_rule_after_inning &&
    leadingScore - trailingScore >= rules.mercy_rule_runs
  )
}

export function isGameOver(
  homeScore: number,
  awayScore: number,
  inning: number,
  half: 'top' | 'bottom',
  rules: WiffleRulesConfig
): boolean {
  const isLastInning = inning >= rules.innings

  // Game ends after the bottom of the last inning if scores differ (includes walk-offs)
  if (isLastInning && half === 'bottom' && homeScore !== awayScore) return true

  // Mercy rule check
  if (checkMercyRule(homeScore, awayScore, inning, rules)) return true
  if (checkMercyRule(awayScore, homeScore, inning, rules)) return true

  return false
}
