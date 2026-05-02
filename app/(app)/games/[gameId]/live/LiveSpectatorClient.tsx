'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Linescore } from '@/components/scoring/Linescore'
import { BaserunnerDiamond } from '@/components/scoring/BaserunnerDiamond'
import { type Tables, type GameWithTeams, type AtBatWithPlayers } from '@/types/database.types'
import { RESULT_LABELS_SHORT, HIT_RESULTS } from '@/lib/wiffle/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  game: GameWithTeams
  innings: Tables<'game_innings'>[]
  recentAtBats: AtBatWithPlayers[]
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
  const rules = initialGame.league?.rules_config

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-5 pb-4">
        <p className="text-xs text-muted-foreground">{initialGame.league?.name}</p>
        <div className="flex items-baseline justify-between mt-1 gap-3">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            {game.away_team.name}
            <span className="text-muted-foreground font-normal mx-1.5">@</span>
            {game.home_team.name}
          </h1>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <span className="live-dot" />
              <span className="text-[11px] font-semibold tracking-wide text-destructive">LIVE</span>
            </span>
          )}
          {game.status === 'final' && (
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground shrink-0">FINAL</span>
          )}
        </div>
      </header>

      <div className="px-4 pb-6 space-y-6">
        <div className="rounded-xl bg-neutral-950 text-white overflow-hidden">
          <div className="px-5 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreBlock
              name={game.away_team.name}
              color={game.away_team.color_hex}
              score={game.away_score}
              align="left"
            />
            <div className="text-center min-w-[68px]">
              {isLive ? (
                <>
                  <p className="font-mono tabular-nums font-semibold text-sm">
                    {game.current_half === 'top' ? '▲' : '▼'} {game.current_inning}
                  </p>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    {game.outs} out{game.outs !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <span className="text-[11px] font-medium tracking-wide text-white/40 uppercase">vs</span>
              )}
            </div>
            <ScoreBlock
              name={game.home_team.name}
              color={game.home_team.color_hex}
              score={game.home_score}
              align="right"
            />
          </div>
        </div>

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

        <section>
          <h2 className="text-sm font-semibold tracking-tight mb-2 px-1">Linescore</h2>
          <Linescore
            game={game as Tables<'games'>}
            homeTeam={game.home_team}
            awayTeam={game.away_team}
            innings={innings}
            totalInnings={rules?.innings}
          />
        </section>

        {atBats.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold tracking-tight mb-2 px-1">Play by play</h2>
            <div className="space-y-1.5">
              {atBats.map((ab) => {
                const isHit = ab.result && HIT_RESULTS.includes(ab.result)
                const isHR = ab.result === 'hr'
                const isWalk = ab.result === 'walk'
                return (
                  <div
                    key={ab.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono tabular-nums text-[11px] text-muted-foreground shrink-0">
                        {ab.top_bottom === 'top' ? '▲' : '▼'}{ab.inning}
                      </span>
                      <span className="text-sm font-medium truncate">{ab.batter?.name}</span>
                      <span className="text-xs text-muted-foreground truncate">vs {ab.pitcher?.name}</span>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold font-mono tabular-nums px-2 py-1 rounded shrink-0',
                        isHR && 'bg-destructive text-live-foreground',
                        isHit && !isHR && 'bg-field/15 text-field',
                        isWalk && 'bg-muted text-foreground',
                        !isHit && !isWalk && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {ab.result ? RESULT_LABELS_SHORT[ab.result] ?? ab.result : '—'}
                      {ab.rbi > 0 && ` · ${ab.rbi}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ScoreBlock({
  name,
  color,
  score,
  align,
}: {
  name: string
  color: string
  score: number
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex flex-col min-w-0',
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      )}
    >
      <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
        <span
          className="w-[3px] h-5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-white/80 truncate max-w-[130px]">
          {name}
        </span>
      </div>
      <span className="font-mono tabular-nums font-semibold text-[56px] leading-none mt-1 text-white">
        {score}
      </span>
    </div>
  )
}
