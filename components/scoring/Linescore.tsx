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
        'relative overflow-x-auto border-y border-border',
        className
      )}
      role="table"
      aria-label="Linescore"
    >
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left pl-4 pr-2 py-2.5 w-28 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase sticky left-0 bg-background z-10">
              Team
            </th>
            {inningNums.map((n) => (
              <th
                key={n}
                className="px-2 py-2.5 w-9 text-center text-[10px] font-semibold text-muted-foreground tabular-nums tracking-[0.1em]"
              >
                {n}
              </th>
            ))}
            <th className="px-2 py-2.5 w-11 text-center text-[10px] font-bold text-foreground border-l border-border tracking-[0.1em]">
              R
            </th>
            <th className="px-2 py-2.5 w-9 text-center text-[10px] font-semibold text-muted-foreground tracking-[0.1em]">
              H
            </th>
            <th className="px-2 py-2.5 w-9 text-center text-[10px] font-semibold text-muted-foreground pr-4 tracking-[0.1em]">
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
        side === 'away' && 'border-b border-border'
      )}
    >
      <td className="pl-4 pr-2 py-3 sticky left-0 bg-background z-10">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1 h-4 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="font-semibold text-sm truncate max-w-[90px] tracking-tight">
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
              'px-2 py-3 text-center font-mono tabular-nums text-sm',
              isCurrent && 'bg-destructive/10 text-destructive font-bold'
            )}
          >
            {runs !== null ? runs : n < currentInning ? '0' : '·'}
          </td>
        )
      })}
      <td className="px-2 py-3 text-center scoreboard text-xl border-l border-border tabular-nums">
        {score}
      </td>
      <td className="px-2 py-3 text-center font-mono tabular-nums text-muted-foreground text-sm">
        {hits}
      </td>
      <td className="px-2 py-3 pr-4 text-center font-mono tabular-nums text-muted-foreground text-sm">
        {errors}
      </td>
    </tr>
  )
}

export function LinescoreSkeleton() {
  return (
    <div className="border-y border-border p-3 space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
