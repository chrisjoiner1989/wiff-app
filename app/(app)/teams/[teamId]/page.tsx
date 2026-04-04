import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const [{ data: team }, { data: batting }, { data: pitching }] = await Promise.all([
    supabase
      .from('teams')
      .select(`*, league:leagues (id, name, season, commissioner_id), players (id, name, number, position, user_id)`)
      .eq('id', teamId)
      .single(),
    supabase.from('batting_stats').select('*').eq('team_id', teamId).gt('ab', 0).order('ba', { ascending: false }),
    supabase.from('pitching_stats').select('*').eq('team_id', teamId).gt('outs_recorded', 0).order('era', { ascending: true }),
  ])

  if (!team) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isCommissioner = user?.id === (team.league as any)?.commissioner_id

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <Link
          href={`/leagues/${(team.league as any)?.id}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {(team.league as any)?.name}
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg shrink-0"
            style={{ backgroundColor: team.color_hex }}
            aria-hidden="true"
          />
          <div>
            <h1 className="font-display text-4xl font-800 tracking-tight leading-none">{team.name}</h1>
            <p className="text-muted-foreground text-sm">{(team.league as any)?.season}</p>
          </div>
        </div>
        {isCommissioner && (
          <Link
            href={`/teams/${teamId}/edit`}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
          >
            Edit Roster
          </Link>
        )}
      </header>

      {/* Roster */}
      <section>
        <h2 className="font-display text-xl font-700 tracking-wide mb-3">ROSTER</h2>
        {!(team.players as any[])?.length ? (
          <p className="text-muted-foreground text-sm">No players yet.</p>
        ) : (
          <div className="space-y-2">
            {(team.players as any[]).map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className="font-display font-700 text-sm"
                    style={{ backgroundColor: team.color_hex + '33', color: team.color_hex }}
                  >
                    {player.number ?? player.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{player.name}</p>
                  {player.position && (
                    <p className="text-xs text-muted-foreground">{player.position}</p>
                  )}
                </div>
                {player.number && (
                  <span className="font-display font-700 text-lg text-muted-foreground">#{player.number}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick batting leaders */}
      {batting && batting.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-700 tracking-wide">BATTING</h2>
            <Link
              href={`/leagues/${(team.league as any)?.id}/stats`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Full stats →
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-3 py-2 font-medium">PLAYER</th>
                  <th className="px-2 py-2 text-center font-medium">AB</th>
                  <th className="px-2 py-2 text-center font-medium">H</th>
                  <th className="px-2 py-2 text-center font-medium">HR</th>
                  <th className="px-2 py-2 text-center font-medium">AVG</th>
                </tr>
              </thead>
              <tbody>
                {batting.map((row) => (
                  <tr key={row.player_id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-medium text-sm">{row.player_name}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{row.ab}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{row.h}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-primary font-700">{row.hr}</td>
                    <td className="px-2 py-2 text-center tabular-nums font-display font-700">
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
  )
}
