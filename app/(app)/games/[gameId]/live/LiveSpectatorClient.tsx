'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Linescore } from '@/components/scoring/Linescore'
import { BaserunnerDiamond } from '@/components/scoring/BaserunnerDiamond'
import { Badge } from '@/components/ui/badge'
import { type WiffleRulesConfig, type Tables } from '@/types/database.types'
import { toast } from 'sonner'

type GameWithTeams = Tables<'games'> & {
  home_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  away_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  league: { id: string; name: string; rules_config: WiffleRulesConfig }
}

type AtBatWithPlayers = Tables<'at_bats'> & {
  batter: { id: string; name: string; number: string | null }
  pitcher: { id: string; name: string; number: string | null }
}

interface Props {
  game: GameWithTeams
  innings: Tables<'game_innings'>[]
  recentAtBats: AtBatWithPlayers[]
}

const RESULT_LABELS: Record<string, string> = {
  single: '1B — Single',
  double: '2B — Double',
  triple: '3B — Triple',
  hr: 'HOME RUN',
  out: 'Out',
  k: 'Strikeout',
  walk: 'Walk (BB)',
  foul_out: 'Foul Out',
  hbp: 'Hit by Pitch',
  fc: 'Fielder\'s Choice',
  error: 'Error',
}

export function LiveSpectatorClient({ game: initialGame, innings: initialInnings, recentAtBats: initialAtBats }: Props) {
  const supabase = createClient()
  const [game, setGame] = useState(initialGame)
  const [innings, setInnings] = useState(initialInnings)
  const [atBats, setAtBats] = useState(initialAtBats)

  useEffect(() => {
    const channel = supabase
      .channel(`live:${game.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
        (payload) => {
          setGame((prev) => ({ ...prev, ...(payload.new as Partial<GameWithTeams>) }))
          toast.info('Score updated')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_innings', filter: `game_id=eq.${game.id}` },
        (payload) => {
          setInnings((prev) => {
            const incoming = payload.new as Tables<'game_innings'>
            const idx = prev.findIndex((i) => i.inning === incoming.inning)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = incoming
              return next
            }
            return [...prev, incoming].sort((a, b) => a.inning - b.inning)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'at_bats', filter: `game_id=eq.${game.id}` },
        async (payload) => {
          // Fetch full at_bat with player joins
          const { data } = await supabase
            .from('at_bats')
            .select(`
              *,
              batter:players!at_bats_batter_id_fkey (id, name, number),
              pitcher:players!at_bats_pitcher_id_fkey (id, name, number)
            `)
            .eq('id', (payload.new as Tables<'at_bats'>).id)
            .single()
          if (data) {
            setAtBats((prev) => [data as unknown as AtBatWithPlayers, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game.id, supabase])

  const isLive = game.status === 'live'
  const rules = initialGame.league.rules_config

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{initialGame.league.name}</p>
            <h1 className="font-display text-xl font-700 tracking-wide">
              {game.away_team.name} @ {game.home_team.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                LIVE
              </Badge>
            )}
            {game.status === 'final' && <Badge variant="secondary">FINAL</Badge>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Score hero */}
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div
              className="w-3 h-3 rounded-sm mx-auto mb-1"
              style={{ backgroundColor: game.away_team.color_hex }}
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{game.away_team.name}</p>
            <p className="font-display text-6xl font-800 tabular-nums leading-none">
              {game.away_score}
            </p>
          </div>
          <div className="text-center">
            {isLive && (
              <>
                <p className="font-display text-lg font-700 text-primary">
                  {game.current_half === 'top' ? '▲' : '▼'} {game.current_inning}
                </p>
                <p className="text-sm text-muted-foreground">
                  {game.outs} out{game.outs !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
          <div className="text-center">
            <div
              className="w-3 h-3 rounded-sm mx-auto mb-1"
              style={{ backgroundColor: game.home_team.color_hex }}
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{game.home_team.name}</p>
            <p className="font-display text-6xl font-800 tabular-nums leading-none">
              {game.home_score}
            </p>
          </div>
        </div>

        {/* Baserunner diamond */}
        {isLive && (
          <div className="flex justify-center">
            <BaserunnerDiamond
              first={!!game.runner_first}
              second={!!game.runner_second}
              third={!!game.runner_third}
              size="lg"
            />
          </div>
        )}

        {/* Linescore */}
        <Linescore
          game={game as Tables<'games'>}
          homeTeam={game.home_team}
          awayTeam={game.away_team}
          innings={innings}
          totalInnings={rules.innings}
        />

        {/* Play-by-play */}
        {atBats.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-700 tracking-wide mb-2">PLAY BY PLAY</h2>
            <div className="space-y-1">
              {atBats.map((ab) => (
                <div
                  key={ab.id}
                  className="flex items-center justify-between p-2 rounded bg-card border border-border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {ab.top_bottom === 'top' ? '▲' : '▼'}{ab.inning}
                    </span>
                    <span className="font-medium">{ab.batter?.name}</span>
                    <span className="text-muted-foreground text-xs">vs {ab.pitcher?.name}</span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      ab.result && ['single', 'double', 'triple', 'hr'].includes(ab.result)
                        ? 'text-emerald-400'
                        : ab.result === 'walk'
                        ? 'text-blue-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {ab.result ? RESULT_LABELS[ab.result] ?? ab.result : '—'}
                    {ab.rbi > 0 && ` (${ab.rbi} RBI)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
