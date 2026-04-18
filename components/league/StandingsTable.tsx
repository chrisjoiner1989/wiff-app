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
    <div className="relative overflow-x-auto rounded-md border border-border bg-card">
      <div aria-hidden="true" className="stitch-rule opacity-80" />
      <table
        className="w-full text-sm min-w-max font-mono"
        role="table"
        aria-label="League standings"
      >
        <thead>
          <tr className="border-b-2 border-border text-muted-foreground">
            <Th className="text-left px-3 w-36 sticky left-0 bg-card z-10">Team</Th>
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
                className={cn(
                  'border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40',
                  isLeader && 'bg-stitch/[0.04]'
                )}
              >
                <td className="px-3 py-2.5 sticky left-0 bg-card z-10 relative">
                  {isLeader && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[3px] bg-stitch rounded-r-sm"
                    />
                  )}
                  <Link
                    href={`/teams/${team.team_id}`}
                    className="flex items-center gap-2 hover:text-stitch transition-colors"
                  >
                    <span
                      className="w-2.5 h-5 rounded-[2px] shrink-0"
                      style={{ backgroundColor: team.color_hex }}
                      aria-hidden="true"
                    />
                    <span className="font-display font-700 text-sm uppercase tracking-wide truncate max-w-[110px]">
                      {team.team_name}
                    </span>
                  </Link>
                </td>
                <Td className="font-display font-800 text-base">{team.wins}</Td>
                <Td className="font-display font-800 text-base text-muted-foreground">
                  {team.losses}
                </Td>
                <Td>{team.pct.toFixed(3).replace(/^0/, '')}</Td>
                <Td className="text-muted-foreground">{gb}</Td>
                <Td>{team.runs_scored}</Td>
                <Td className="text-muted-foreground">{team.runs_allowed}</Td>
                <td
                  className={cn(
                    'px-2 py-2.5 pr-3 text-center tabular-nums font-700',
                    team.run_diff > 0
                      ? 'text-pennant'
                      : team.run_diff < 0
                      ? 'text-clay'
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
        'px-2 py-2.5 text-center font-display font-700 tracking-[0.14em] uppercase text-[10px]',
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
        'px-2 py-2.5 text-center tabular-nums text-sm',
        className
      )}
    >
      {children}
    </td>
  )
}
