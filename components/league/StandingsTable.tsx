import Link from 'next/link'
import { type StandingsRow } from '@/types/database.types'

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
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm min-w-max" role="table" aria-label="League standings">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs">
            <th className="text-left px-3 py-2 font-medium sticky left-0 bg-card z-10 w-36">TEAM</th>
            <th className="px-2 py-2 text-center font-medium w-10">W</th>
            <th className="px-2 py-2 text-center font-medium w-10">L</th>
            <th className="px-2 py-2 text-center font-medium w-14">PCT</th>
            <th className="px-2 py-2 text-center font-medium w-12">GB</th>
            <th className="px-2 py-2 text-center font-medium w-10">RS</th>
            <th className="px-2 py-2 text-center font-medium w-10">RA</th>
            <th className="px-2 py-2 text-center font-medium w-14">DIFF</th>
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

            return (
              <tr
                key={team.team_id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 sticky left-0 bg-card z-10">
                  <Link
                    href={`/teams/${team.team_id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: team.color_hex }}
                      aria-hidden="true"
                    />
                    <span className="font-medium truncate max-w-[100px]">{team.team_name}</span>
                  </Link>
                </td>
                <td className="px-2 py-2 text-center font-display font-700 tabular-nums">{team.wins}</td>
                <td className="px-2 py-2 text-center font-display font-700 tabular-nums">{team.losses}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {team.pct.toFixed(3).replace(/^0/, '')}
                </td>
                <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{gb}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.runs_scored}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.runs_allowed}</td>
                <td
                  className={`px-2 py-2 text-center tabular-nums font-medium ${
                    team.run_diff > 0
                      ? 'text-emerald-400'
                      : team.run_diff < 0
                      ? 'text-red-400'
                      : 'text-muted-foreground'
                  }`}
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
