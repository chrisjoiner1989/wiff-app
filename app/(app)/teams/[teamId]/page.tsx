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
      {/* Masthead */}
      <header className="px-5 pt-5 pb-4">
        <Link
          href={`/leagues/${league?.id}`}
          className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.24em] uppercase text-muted-foreground font-700 hover:text-stitch transition"
        >
          <ChevronLeft className="h-3 w-3" />
          {league?.name}
        </Link>

        <div className="flex items-start gap-3 mt-2">
          <span
            className="w-2 h-14 rounded-sm shrink-0 mt-1"
            style={{ backgroundColor: team.color_hex }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-display text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-700">
              {league?.season}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-800 tracking-tight uppercase leading-[0.95] break-words mt-0.5">
              {team.name}<span className="text-stitch">.</span>
            </h1>
          </div>
        </div>

        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />

        {isCommissioner && (
          <div className="mt-4">
            <Link
              href={`/teams/${teamId}/edit`}
              className="font-display text-[11px] tracking-[0.22em] uppercase font-700 px-3 h-9 inline-flex items-center rounded-md ring-1 ring-border hover:ring-foreground/30 hover:text-stitch transition"
            >
              Edit Roster
            </Link>
          </div>
        )}
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Roster */}
        <section>
          <SectionHead label="Roster" count={players.length} />
          {!players.length ? (
            <div className="text-center py-10 px-6 space-y-2 rounded-md border border-dashed border-border bg-card/60">
              <p className="font-display text-sm tracking-[0.18em] uppercase text-muted-foreground font-700">
                No players yet
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li key={player.id}>
                  <Link
                    href={`/players/${player.id}`}
                    className="group flex items-center gap-3 p-3 rounded-md bg-card border border-border hover:border-foreground/30 hover:-translate-y-[1px] transition-all"
                  >
                    <div
                      className="h-10 w-10 shrink-0 rounded-sm flex items-center justify-center font-mono tabular-nums font-700 text-sm"
                      style={{
                        backgroundColor: team.color_hex + '22',
                        color: team.color_hex,
                      }}
                      aria-hidden="true"
                    >
                      {player.number != null ? player.number : player.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-700 text-sm tracking-[0.04em] uppercase truncate group-hover:text-stitch transition-colors">
                        {player.name}
                      </p>
                      {player.position && (
                        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-600 mt-0.5">
                          {player.position}
                        </p>
                      )}
                    </div>
                    {player.number != null && (
                      <span className="font-mono tabular-nums text-[10px] text-muted-foreground shrink-0">
                        #{String(player.number).padStart(2, '0')}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Batting leaders */}
        {batting && batting.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="inline-block w-1 h-3.5 rounded-sm bg-foreground" />
                <h2 className="font-display text-xs font-800 tracking-[0.24em] uppercase">
                  Batting
                </h2>
              </div>
              <Link
                href={`/leagues/${league?.id}/stats`}
                className="inline-flex items-center gap-1 font-display text-[10px] tracking-[0.2em] uppercase font-700 text-muted-foreground hover:text-stitch transition"
              >
                Full Card
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-md border border-border bg-card">
              <div aria-hidden="true" className="stitch-rule opacity-80" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground">
                        Player
                      </th>
                      <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground">
                        AB
                      </th>
                      <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground">
                        H
                      </th>
                      <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground">
                        HR
                      </th>
                      <th className="px-2 py-2 text-center font-display text-[10px] tracking-[0.18em] uppercase font-800 text-muted-foreground">
                        AVG
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batting.map((row) => (
                      <tr key={row.player_id} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2 font-display font-700 text-sm tracking-[0.04em] uppercase truncate">
                          {row.player_name}
                        </td>
                        <td className="px-2 py-2 text-center font-mono tabular-nums text-sm">
                          {row.ab}
                        </td>
                        <td className="px-2 py-2 text-center font-mono tabular-nums text-sm">
                          {row.h}
                        </td>
                        <td className="px-2 py-2 text-center font-mono tabular-nums text-sm text-stitch font-700">
                          {row.hr}
                        </td>
                        <td className="px-2 py-2 text-center font-mono tabular-nums font-700 text-sm">
                          {Number(row.ba).toFixed(3).replace(/^0/, '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SectionHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block w-1 h-3.5 rounded-sm bg-foreground" />
        <h2 className="font-display text-xs font-800 tracking-[0.24em] uppercase">
          {label}
        </h2>
      </div>
      {count !== undefined && (
        <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
          {String(count).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}
