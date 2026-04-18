import Link from 'next/link'
import { type PitchingStatsRow } from '@/types/database.types'

interface Props {
  stats: PitchingStatsRow[]
}

export function PitchingStatsTable({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm font-display tracking-[0.16em] uppercase">
        No pitching stats yet.
      </p>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-card">
      <div aria-hidden="true" className="stitch-rule opacity-80" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-max" role="table" aria-label="Pitching statistics">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground sticky left-0 bg-card z-10 w-36">
                Player
              </th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Games">G</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-12" title="Innings Pitched">IP</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Hits Allowed">H</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Runs">R</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Earned Runs">ER</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Walks">BB</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-10" title="Strikeouts">K</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-16" title="Earned Run Average">ERA</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-16" title="Walks + Hits per Inning">WHIP</th>
              <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground w-16" title="Strikeouts per 9 innings">K/9</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => {
              const ip = `${row.ip_full}.${row.ip_partial}`
              return (
                <tr
                  key={row.player_id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 sticky left-0 bg-card z-10">
                    <Link
                      href={`/players/${row.player_id}`}
                      className="flex flex-col hover:text-stitch transition-colors"
                    >
                      <span className="font-display font-700 text-sm tracking-[0.04em] uppercase truncate max-w-[120px]">
                        {row.player_name}
                      </span>
                      <span className="font-display text-[9px] tracking-[0.2em] uppercase text-muted-foreground truncate max-w-[120px] font-600 mt-0.5">
                        {row.team_name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.g}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums font-700">{ip}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.h}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.r}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.er}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.bb}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">{row.k}</td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums font-700 text-stitch">
                    {row.era != null ? Number(row.era).toFixed(2) : '—'}
                  </td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">
                    {row.whip != null ? Number(row.whip).toFixed(2) : '—'}
                  </td>
                  <td className="px-2 py-2 text-center font-mono tabular-nums">
                    {row.k_per_9 != null ? Number(row.k_per_9).toFixed(1) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
