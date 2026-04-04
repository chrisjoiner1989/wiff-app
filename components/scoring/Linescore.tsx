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
        'overflow-x-auto rounded-lg border border-border bg-card font-display',
        className
      )}
      role="table"
      aria-label="Linescore"
    >
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs">
            <th className="text-left px-3 py-2 w-28 font-medium sticky left-0 bg-card z-10">
              TEAM
            </th>
            {inningNums.map((n) => (
              <th key={n} className="px-2 py-2 w-8 text-center font-medium">
                {n}
              </th>
            ))}
            <th className="px-2 py-2 w-8 text-center font-semibold text-foreground border-l border-border">
              R
            </th>
            <th className="px-2 py-2 w-8 text-center font-medium">H</th>
            <th className="px-2 py-2 w-8 text-center font-medium">E</th>
          </tr>
        </thead>
        <tbody>
          {/* Away row */}
          <tr className="border-b border-border/50">
            <td className="px-3 py-2 font-semibold text-sm sticky left-0 bg-card z-10 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: awayTeam.color_hex }}
                aria-hidden="true"
              />
              <span className="truncate max-w-[80px]">{awayTeam.name}</span>
            </td>
            {inningNums.map((n) => {
              const runs = getInningRuns(n, 'away')
              const isCurrent = n === game.current_inning && game.current_half === 'top' && game.status === 'live'
              return (
                <td
                  key={n}
                  className={cn(
                    'px-2 py-2 text-center tabular-nums',
                    isCurrent && 'bg-primary/10 text-primary font-semibold'
                  )}
                >
                  {runs !== null ? runs : (n < game.current_inning ? '0' : '–')}
                </td>
              )
            })}
            <td className="px-2 py-2 text-center font-display font-700 text-base border-l border-border tabular-nums">
              {game.away_score}
            </td>
            <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
              {innings.reduce((sum, i) => sum + i.away_hits, 0)}
            </td>
            <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
              {innings.reduce((sum, i) => sum + i.away_errors, 0)}
            </td>
          </tr>

          {/* Home row */}
          <tr>
            <td className="px-3 py-2 font-semibold text-sm sticky left-0 bg-card z-10 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: homeTeam.color_hex }}
                aria-hidden="true"
              />
              <span className="truncate max-w-[80px]">{homeTeam.name}</span>
            </td>
            {inningNums.map((n) => {
              const runs = getInningRuns(n, 'home')
              const isCurrent = n === game.current_inning && game.current_half === 'bottom' && game.status === 'live'
              return (
                <td
                  key={n}
                  className={cn(
                    'px-2 py-2 text-center tabular-nums',
                    isCurrent && 'bg-primary/10 text-primary font-semibold'
                  )}
                >
                  {runs !== null ? runs : (n < game.current_inning ? '0' : '–')}
                </td>
              )
            })}
            <td className="px-2 py-2 text-center font-display font-700 text-base border-l border-border tabular-nums">
              {game.home_score}
            </td>
            <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
              {innings.reduce((sum, i) => sum + i.home_hits, 0)}
            </td>
            <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
              {innings.reduce((sum, i) => sum + i.home_errors, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function LinescoreSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
