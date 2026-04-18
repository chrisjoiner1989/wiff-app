import Link from 'next/link'
import { type BattingStatsRow } from '@/types/database.types'

interface Props {
  stats: BattingStatsRow[]
}

const COLUMNS: { key: keyof BattingStatsRow; label: string; title: string }[] = [
  { key: 'player_name', label: 'Player', title: 'Player' },
  { key: 'g', label: 'G', title: 'Games' },
  { key: 'ab', label: 'AB', title: 'At Bats' },
  { key: 'h', label: 'H', title: 'Hits' },
  { key: '2b', label: '2B', title: 'Doubles' },
  { key: '3b', label: '3B', title: 'Triples' },
  { key: 'hr', label: 'HR', title: 'Home Runs' },
  { key: 'rbi', label: 'RBI', title: 'Runs Batted In' },
  { key: 'bb', label: 'BB', title: 'Walks' },
  { key: 'k', label: 'K', title: 'Strikeouts' },
  { key: 'ba', label: 'AVG', title: 'Batting Average' },
  { key: 'obp', label: 'OBP', title: 'On-Base Percentage' },
  { key: 'slg', label: 'SLG', title: 'Slugging Percentage' },
]

export function BattingStatsTable({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm font-display tracking-[0.16em] uppercase">
        No batting stats yet.
      </p>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-card">
      <div aria-hidden="true" className="stitch-rule opacity-80" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-max" role="table" aria-label="Batting statistics">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  title={col.title}
                  className={`px-2 py-2 font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground ${
                    col.key === 'player_name'
                      ? 'text-left w-36 sticky left-0 bg-card z-10 px-3'
                      : 'text-center w-12'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
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
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row.ab}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums font-700">{row.h}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row['2b']}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row['3b']}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums font-700 text-stitch">{row.hr}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row.rbi}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row.bb}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">{row.k}</td>
                <td className="px-2 py-2 text-center font-mono tabular-nums font-700">
                  {Number(row.ba).toFixed(3).replace(/^0/, '')}
                </td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">
                  {Number(row.obp).toFixed(3).replace(/^0/, '')}
                </td>
                <td className="px-2 py-2 text-center font-mono tabular-nums">
                  {Number(row.slg).toFixed(3).replace(/^0/, '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
