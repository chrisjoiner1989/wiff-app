import Link from 'next/link'
import { type StandingsRow } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface StandingsTableProps {
  standings: StandingsRow[]
}

export function StandingsTable({ standings }: StandingsTableProps) {
  const sorted = [...standings].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct
    return b.run_diff - a.run_diff
  })

  const leader = sorted[0]

  return (
    <div className="relative overflow-x-auto border-y border-border">
      <table
        className="w-full text-sm min-w-max"
        role="table"
        aria-label="League standings"
      >
        <thead>
          <tr className="border-b border-border">
            <Th className="text-left pl-3 pr-2 w-40 sticky left-0 bg-background z-10">
              <span className="block text-left">Team</span>
            </Th>
            <Th className="w-10">W</Th>
            <Th className="w-10">L</Th>
            <Th className="w-14">Pct</Th>
            <Th className="w-12">GB</Th>
            <Th className="w-10">RS</Th>
            <Th className="w-10">RA</Th>
            <Th className="w-14 pr-3">Diff</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, idx) => {
            const gb =
              idx === 0
                ? '—'
                : (
                    (leader.wins - team.wins + (team.losses - leader.losses)) /
                    2
                  ).toFixed(1)
            const isLeader = idx === 0

            return (
              <tr
                key={team.team_id}
                className="border-b border-border/60 last:border-0 row-hover"
              >
                <td className="pl-3 pr-2 py-3 sticky left-0 bg-background z-10 relative">
                  {isLeader && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-foreground"
                    />
                  )}
                  <Link
                    href={`/teams/${team.team_id}`}
                    className="flex items-center gap-2.5 hover:text-foreground transition-colors"
                  >
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-3">
                      {idx + 1}
                    </span>
                    <span
                      className="w-1 h-4 rounded-sm shrink-0"
                      style={{ backgroundColor: team.color_hex }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-sm truncate max-w-[110px] tracking-tight">
                      {team.team_name}
                    </span>
                  </Link>
                </td>
                <Td className="scoreboard text-foreground">{team.wins}</Td>
                <Td className="font-mono text-muted-foreground">
                  {team.losses}
                </Td>
                <Td className="font-mono font-semibold">
                  {team.pct.toFixed(3).replace(/^0/, '')}
                </Td>
                <Td className="font-mono text-muted-foreground">{gb}</Td>
                <Td className="font-mono">{team.runs_scored}</Td>
                <Td className="font-mono text-muted-foreground">{team.runs_allowed}</Td>
                <td
                  className={cn(
                    'px-2 py-3 pr-3 text-center font-mono tabular-nums text-sm font-semibold',
                    team.run_diff > 0
                      ? 'text-field'
                      : team.run_diff < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {team.run_diff > 0 ? '+' : ''}
                  {team.run_diff}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'px-2 py-2.5 text-center text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase',
        className
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td
      className={cn(
        'px-2 py-3 text-center tabular-nums text-sm',
        className
      )}
    >
      {children}
    </td>
  )
}
