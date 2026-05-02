'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Utility']

interface Player {
  id: string
  name: string
  number: string | null
  position: string | null
}

interface LineupSlot {
  battingOrder: number
  playerId: string | null
  position: string | null
  isPitcher: boolean
}

function emptyLineup(size = 9): LineupSlot[] {
  return Array.from({ length: size }, (_, i) => ({
    battingOrder: i + 1,
    playerId: null,
    position: null,
    isPitcher: false,
  }))
}

export default function LineupBuilderPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [game, setGame] = useState<any>(null)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [homeLineup, setHomeLineup] = useState<LineupSlot[]>(emptyLineup())
  const [awayLineup, setAwayLineup] = useState<LineupSlot[]>(emptyLineup())
  const [activeTab, setActiveTab] = useState<'away' | 'home'>('away')

  useEffect(() => {
    async function load() {
      const { data: g } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey (id, name, color_hex),
          away_team:teams!games_away_team_id_fkey (id, name, color_hex)
        `)
        .eq('id', gameId)
        .single()

      if (!g) { router.push('/'); return }
      setGame(g)

      const [{ data: hp }, { data: ap }] = await Promise.all([
        supabase.from('players').select('id, name, number, position').eq('team_id', g.home_team_id),
        supabase.from('players').select('id, name, number, position').eq('team_id', g.away_team_id),
      ])
      setHomePlayers(hp ?? [])
      setAwayPlayers(ap ?? [])

      // Load existing lineups
      const { data: existing } = await supabase
        .from('game_lineups')
        .select('*')
        .eq('game_id', gameId)

      if (existing?.length) {
        const home = emptyLineup()
        const away = emptyLineup()
        for (const entry of existing) {
          const slot: LineupSlot = {
            battingOrder: entry.batting_order,
            playerId: entry.player_id,
            position: entry.position,
            isPitcher: entry.is_pitcher,
          }
          if (entry.team_id === g.home_team_id) {
            home[entry.batting_order - 1] = slot
          } else {
            away[entry.batting_order - 1] = slot
          }
        }
        setHomeLineup(home)
        setAwayLineup(away)
      }

      setLoading(false)
    }
    load()
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateSlot(
    team: 'home' | 'away',
    idx: number,
    field: keyof LineupSlot,
    value: string | boolean | null
  ) {
    const setter = team === 'home' ? setHomeLineup : setAwayLineup
    setter((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      // Unmark previous pitcher if marking a new one
      if (field === 'isPitcher' && value === true) {
        return next.map((s, i) => i === idx ? s : { ...s, isPitcher: false })
      }
      return next
    })
  }

  async function saveLineup(team: 'home' | 'away') {
    if (!game) return
    setSaving(true)
    const teamId = team === 'home' ? game.home_team_id : game.away_team_id
    const lineup = team === 'home' ? homeLineup : awayLineup
    const slots = lineup.filter((s) => s.playerId !== null)

    // Delete existing for this team
    await supabase.from('game_lineups').delete().eq('game_id', gameId).eq('team_id', teamId)

    const rows = slots.map((s) => ({
      game_id: gameId,
      team_id: teamId,
      player_id: s.playerId!,
      batting_order: s.battingOrder,
      position: s.position,
      is_pitcher: s.isPitcher,
    }))

    const { error } = await supabase.from('game_lineups').insert(rows)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${team === 'home' ? game.home_team.name : game.away_team.name} lineup saved!`)
  }

  async function startGame() {
    if (!game) return
    const { error } = await supabase
      .from('games')
      .update({ status: 'live' })
      .eq('id', gameId)
    if (error) { toast.error(error.message); return }
    toast.success('Game started!')
    router.push(`/games/${gameId}/score`)
  }

  const players = activeTab === 'home' ? homePlayers : awayPlayers
  const lineup = activeTab === 'home' ? homeLineup : awayLineup

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 space-y-3">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      <header className="px-1">
        <p className="text-sm text-muted-foreground font-medium">Pre-game</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-0.5">Lineups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {game.away_team.name} @ {game.home_team.name}
        </p>
      </header>

      <div className="flex gap-2">
        {(['away', 'home'] as const).map((t) => {
          const teamObj = t === 'away' ? game.away_team : game.home_team
          const active = activeTab === t
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium tap transition-colors border ${
                active
                  ? 'border-foreground/20 bg-card text-foreground shadow-sm'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <span
                className="w-[3px] h-4 rounded-full"
                style={{ backgroundColor: teamObj.color_hex }}
                aria-hidden="true"
              />
              {teamObj.name}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {lineup.map((slot, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
            <span className="font-mono tabular-nums font-semibold text-sm w-6 text-center text-muted-foreground">
              {idx + 1}
            </span>

            <Select
              value={slot.playerId ?? ''}
              onValueChange={(v) => updateSlot(activeTab, idx, 'playerId', v || null)}
            >
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.number ? `#${p.number} ` : ''}{p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={slot.position ?? ''}
              onValueChange={(v) => updateSlot(activeTab, idx, 'position', v || null)}
            >
              <SelectTrigger className="w-20 h-9 text-xs">
                <SelectValue placeholder="Pos" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => updateSlot(activeTab, idx, 'isPitcher', !slot.isPitcher)}
              className={`h-9 w-9 rounded-md text-xs font-semibold tap transition-colors ${
                slot.isPitcher
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:border-foreground/30'
              }`}
              aria-label={slot.isPitcher ? 'Remove as pitcher' : 'Set as pitcher'}
            >
              P
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => saveLineup(activeTab)}
          disabled={saving}
        >
          Save {activeTab === 'home' ? game.home_team.name : game.away_team.name}
        </Button>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={startGame}
        disabled={saving}
      >
        Start game
      </Button>
    </div>
  )
}
