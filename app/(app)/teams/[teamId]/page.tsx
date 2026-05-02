import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const [{ data: team }, { data: batting }] = await Promise.all([
    supabase
      .from('teams')
      .select(`*, league:leagues (id, name, season, commissioner_id), players (id, name, number, position, user_id)`)
      .eq('id', teamId)
      .single(),
    supabase.from('batting_stats').select('*').eq('team_id', teamId).gt('ab', 0).order('ba', { ascending: false }),
  ])

  if (!team) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const league = team.league as any
  const players = (team.players as any[]) ?? []
  const isCommissioner = user?.id === league?.commissioner_id

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-6 pb-5">
        <Link
          href={`/leagues/${league?.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
          {league?.name}
        </Link>

        <div className="flex items-start gap-3 mt-3">
          <span
            className="w-1 h-12 rounded-sm shrink-0 mt-1"
            style={{ backgroundColor: team.color_hex }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="eyebrow">Season {league?.season}</p>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[1.05] break-words mt-1.5">
              {team.name}
            </h1>
          </div>
        </div>

        {isCommissioner && (
          <div className="mt-4">
            <Link
              href={`/teams/${teamId}/edit`}
              className="text-[13px] font-semibold px-3.5 h-8 inline-flex items-center rounded-full bg-muted text-foreground tap hover:bg-muted/70 transition-colors"
            >
              Edit roster
            </Link>
          </div>
        )}
      </header>

      <div className="pb-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-2 px-4">
            <h2 className="eyebrow">Roster</h2>
            <span className="text-[10px] text-muted-foreground tabular-nums font-semibold">
              {String(players.length).padStart(2, '0')}
            </span>
          </div>
          {!players.length ? (
            <div className="border-y border-border px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">No players yet</p>
            </div>
          ) : (
            <ul className="px-4 divide-y divide-border border-y border-border">
              {players.map((player) => (
                <li key={player.id}>
                  <Link
                    href={`/players/${player.id}`}
                    className="group flex items-center gap-3 py-3 -mx-4 px-4 row-hover tap"
                  >
                    <div
                      className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center scoreboard text-sm"
                      style={{
                        backgroundColor: team.color_hex + '1a',
                        color: team.color_hex,
                      }}
                      aria-hidden="true"
                    >
                      {player.number != null ? player.number : player.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold truncate leading-tight">
                        {player.name}
                      </p>
                      {player.position && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mt-1">
                          {player.position}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {batting && batting.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 px-4">
              <h2 className="eyebrow">Batting</h2>
              <Link
                href={`/leagues/${league?.id}/stats`}
                className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Full stats
                <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="border-y border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                      Player
                    </th>
                    <th className="px-2 py-2.5 text-center text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                      AB
                    </th>
                    <th className="px-2 py-2.5 text-center text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                      H
                    </th>
                    <th className="px-2 py-2.5 text-center text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                      HR
                    </th>
                    <th className="px-2 py-2.5 pr-4 text-center text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                      AVG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batting.map((row) => (
                    <tr key={row.player_id} className="border-b border-border/60 last:border-0 row-hover">
                      <td className="px-4 py-2.5 text-sm font-semibold truncate">
                        {row.player_name}
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm text-muted-foreground">
                        {row.ab}
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm text-muted-foreground">
                        {row.h}
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-sm text-destructive font-bold">
                        {row.hr}
                      </td>
                      <td className="px-2 py-2.5 pr-4 text-center scoreboard text-sm">
                        {Number(row.ba).toFixed(3).replace(/^0/, '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
