'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Plus, Trash2, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Utility'] as const

const playerSchema = z.object({
  name: z.string().min(1, 'Name required').max(50, 'Name too long'),
  number: z.string().regex(/^\d{0,2}$/, 'Must be a number 0–99').optional(),
  position: z.enum(POSITIONS).optional(),
})

interface Player {
  id: string
  name: string
  number: string | null
  position: string | null
}

interface NewPlayer {
  name: string
  number: string
  position: string
}

export default function EditRosterPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayer, setNewPlayer] = useState<NewPlayer>({ name: '', number: '', position: 'P' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: t }, { data: p }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('teams').select('id, name, color_hex, league_id, league:leagues(commissioner_id)').eq('id', teamId).single(),
        supabase.from('players').select('id, name, number, position').eq('team_id', teamId).order('number'),
      ])
      const league = t?.league as { commissioner_id: string } | null
      if (!user || !league || league.commissioner_id !== user.id) {
        router.replace(`/teams/${teamId}`)
        return
      }
      setTeam(t)
      setPlayers(p ?? [])
      setLoading(false)
    }
    load()
  }, [teamId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function addPlayer() {
    const result = playerSchema.safeParse(newPlayer)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setAdding(true)
    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: teamId,
        name: result.data.name.trim(),
        number: result.data.number || null,
        position: result.data.position || null,
      })
      .select()
      .single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setPlayers((prev) => [...prev, data])
    setNewPlayer({ name: '', number: '', position: 'P' })
    toast.success(`${data.name} added to roster`)
  }

  async function removePlayer(id: string, name: string) {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setPlayers((prev) => prev.filter((p) => p.id !== id))
    toast.info(`${name} removed from roster`)
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 space-y-3">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      <header className="px-1">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          <ChevronLeft className="h-3 w-3" />Back
        </button>
        <h1 className="text-3xl font-semibold tracking-tight mt-0.5">Edit roster</h1>
        <p className="text-sm text-muted-foreground mt-1">{team?.name}</p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Add player</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="pname">Name</Label>
              <Input
                id="pname"
                placeholder="Player name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnum">Number</Label>
              <Input
                id="pnum"
                placeholder="00"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer((p) => ({ ...p, number: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setNewPlayer((p) => ({ ...p, position: pos }))}
                className={`px-2.5 h-8 rounded-md text-xs font-medium tap transition-colors border ${
                  newPlayer.position === pos
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
          <Button
            onClick={addPlayer}
            disabled={adding || !newPlayer.name.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            {adding ? 'Adding…' : 'Add player'}
          </Button>
        </CardContent>
      </Card>

      <section>
        <div className="flex items-baseline justify-between mb-2 px-1">
          <h2 className="text-sm font-semibold tracking-tight">Roster</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{players.length}</span>
        </div>
        {players.length === 0 ? (
          <div className="text-center py-10 px-6 rounded-xl border border-dashed border-border bg-card/60">
            <p className="text-sm text-muted-foreground">No players yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="font-mono tabular-nums font-semibold text-sm w-10 shrink-0 text-center"
                    style={{ color: team?.color_hex }}
                  >
                    {player.number != null ? `#${String(player.number).padStart(2, '0')}` : '—'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{player.name}</p>
                    {player.position && (
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removePlayer(player.id, player.name)}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Remove ${player.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
