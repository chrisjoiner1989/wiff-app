import { type AtBatResult } from '@/types/database.types'

// Human-readable labels for at-bat results, used in play-by-play displays.
export const RESULT_LABELS: Record<AtBatResult, string> = {
  single:   '1B — Single',
  double:   '2B — Double',
  triple:   '3B — Triple',
  hr:       'HOME RUN',
  out:      'Out',
  k:        'Strikeout',
  walk:     'Walk (BB)',
  foul_out: 'Foul Out',
  hbp:      'Hit by Pitch',
  fc:       "Fielder's Choice",
  error:    'Error',
}

// Short labels for compact displays (box score, game card).
export const RESULT_LABELS_SHORT: Record<AtBatResult, string> = {
  single:   '1B',
  double:   '2B',
  triple:   '3B',
  hr:       'HR',
  out:      'Out',
  k:        'K',
  walk:     'BB',
  foul_out: 'FO',
  hbp:      'HBP',
  fc:       'FC',
  error:    'E',
}

export const HIT_RESULTS: AtBatResult[] = ['single', 'double', 'triple', 'hr']
