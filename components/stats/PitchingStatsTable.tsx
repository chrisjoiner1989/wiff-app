import Link from 'next/link'
import { type PitchingStatsRow } from '@/types/database.types'

interface Props {
  stats: PitchingStatsRow[]
}

export function PitchingStatsTable({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        No pitching stats yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm min-w-max" role="table" aria-label="Pitching statistics">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2.5 text-[11px] font-medium tracking-wide uppercase text-muted-foreground sticky left-0 bg-card z-10 w-36">
              Player
            </th>
            {['G', 'IP', 'H', 'R', 'ER', 'BB', 'K', 'ERA', 'WHIP', 'K/9'].map((label, i) => (
              <th
                key={i}
                className="px-2 py-2.5 text-center text-[11px] font-medium tracking-wide uppercase text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => {
            const ip = `${row.ip_full}.${row.ip_partial}`
            return (
              <tr
                key={row.player_id}
                className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors"
              >
                <td className="px-3 py-2.5 sticky left-0 bg-card z-10">
                  <Link
                    href={`/players/${row.player_id}`}
                    className="flex flex-col hover:text-foreground transition-colors"
                  >
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {row.player_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                      {row.team_name}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.g}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm font-medium">{ip}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.h}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.r}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.er}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.bb}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">{row.k}</td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm font-semibold">
                  {row.era != null ? Number(row.era).toFixed(2) : '—'}
                </td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">
                  {row.whip != null ? Number(row.whip).toFixed(2) : '—'}
                </td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm">
                  {row.k_per_9 != null ? Number(row.k_per_9).toFixed(1) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
