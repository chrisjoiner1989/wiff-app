import { cn } from '@/lib/utils'
import { type Tables } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'

interface LinescoreProps {
  game: Tables<'games'>
  homeTeam: { name: string; color_hex: string }
  awayTeam: { name: string; color_hex: string }
  innings: Tables<'game_innings'>[]
  totalInnings?: number
  className?: string
}

export function Linescore({
  game,
  homeTeam,
  awayTeam,
  innings,
  totalInnings = 9,
  className,
}: LinescoreProps) {
  const displayInnings = Math.max(totalInnings, game.current_inning)
  const inningNums = Array.from({ length: displayInnings }, (_, i) => i + 1)

  function getInningRuns(inning: number, team: 'home' | 'away') {
    const row = innings.find((i) => i.inning === inning)
    if (!row) return null
    return team === 'home' ? row.home_runs : row.away_runs
  }

  return (
    <div
      className={cn(
        'relative overflow-x-auto rounded-md border border-border bg-card',
        className
      )}
      role="table"
      aria-label="Linescore"
    >
      {/* Stitch rule up top — the scorecard header */}
      <div aria-hidden="true" className="stitch-rule opacity-80" />

      <table className="w-full text-sm min-w-max font-mono">
        <thead>
          <tr className="border-b-2 border-border text-muted-foreground">
            <th className="text-left px-3 py-2.5 w-28 font-display font-700 tracking-[0.14em] uppercase text-[10px] sticky left-0 bg-card z-10">
              Team
            </th>
            {inningNums.map((n) => (
              <th
                key={n}
                className="px-2 py-2.5 w-9 text-center font-display font-700 text-[11px] tabular-nums"
              >
                {n}
              </th>
            ))}
            <th className="px-2 py-2.5 w-10 text-center font-display font-800 text-stitch text-[12px] border-l-2 border-border">
              R
            </th>
            <th className="px-2 py-2.5 w-9 text-center font-display font-700 text-[11px]">
              H
            </th>
            <th className="px-2 py-2.5 w-9 text-center font-display font-700 text-[11px] pr-3">
              E
            </th>
          </tr>
        </thead>
        <tbody>
          <TeamRow
            side="away"
            name={awayTeam.name}
            color={awayTeam.color_hex}
            score={game.away_score}
            hits={innings.reduce((s, i) => s + i.away_hits, 0)}
            errors={innings.reduce((s, i) => s + i.away_errors, 0)}
            inningNums={inningNums}
            getRuns={(n) => getInningRuns(n, 'away')}
            currentInning={game.current_inning}
            isCurrentHalf={game.current_half === 'top' && game.status === 'live'}
          />
          <TeamRow
            side="home"
            name={homeTeam.name}
            color={homeTeam.color_hex}
            score={game.home_score}
            hits={innings.reduce((s, i) => s + i.home_hits, 0)}
            errors={innings.reduce((s, i) => s + i.home_errors, 0)}
            inningNums={inningNums}
            getRuns={(n) => getInningRuns(n, 'home')}
            currentInning={game.current_inning}
            isCurrentHalf={game.current_half === 'bottom' && game.status === 'live'}
          />
        </tbody>
      </table>
    </div>
  )
}

function TeamRow({
  name,
  color,
  score,
  hits,
  errors,
  inningNums,
  getRuns,
  currentInning,
  isCurrentHalf,
  side,
}: {
  name: string
  color: string
  score: number
  hits: number
  errors: number
  inningNums: number[]
  getRuns: (n: number) => number | null
  currentInning: number
  isCurrentHalf: boolean
  side: 'home' | 'away'
}) {
  return (
    <tr
      className={cn(
        'border-b border-border/60 last:border-0',
        side === 'away' && 'border-b-2'
      )}
    >
      <td className="px-3 py-2.5 sticky left-0 bg-card z-10">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-5 rounded-[2px] shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="font-display font-700 text-sm tracking-wide uppercase truncate max-w-[90px]">
            {name}
          </span>
        </div>
      </td>
      {inningNums.map((n) => {
        const runs = getRuns(n)
        const isCurrent = n === currentInning && isCurrentHalf
        return (
          <td
            key={n}
            className={cn(
              'px-2 py-2.5 text-center tabular-nums text-base font-500',
              isCurrent &&
                'bg-stitch/10 text-stitch font-800 ring-1 ring-inset ring-stitch/30'
            )}
          >
            {runs !== null ? runs : n < currentInning ? '0' : '·'}
          </td>
        )
      })}
      <td className="px-2 py-2.5 text-center font-display font-800 text-xl border-l-2 border-border tabular-nums">
        {score}
      </td>
      <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground text-sm">
        {hits}
      </td>
      <td className="px-2 py-2.5 pr-3 text-center tabular-nums text-muted-foreground text-sm">
        {errors}
      </td>
    </tr>
  )
}

export function LinescoreSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
