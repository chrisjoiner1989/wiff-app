'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDeleteGame } from '@/lib/queries/games'
import { GameCard } from '@/components/league/GameCard'

export default function GamesPage() {
  const supabase = createClient()
  const deleteGame = useDeleteGame()

  const [games, setGames] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('games')
          .select(`
            *,
            home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
            away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
            league:leagues (id, name, commissioner_id)
          `)
          .order('scheduled_at', { ascending: false })
          .limit(30),
      ])
      setUserId(user?.id ?? null)
      setGames(data ?? [])
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    await deleteGame.mutateAsync(id, {
      onSuccess: () => {
        setGames((prev) => prev.filter((g) => g.id !== id))
        toast.success('Game deleted')
      },
      onError: (e: any) => toast.error(e.message),
    })
  }

  const live = games.filter((g) => g.status === 'live')
  const upcoming = games.filter((g) => g.status === 'scheduled')
  const completed = games.filter((g) => g.status === 'final')

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-7 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Schedule</p>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-none">
              Games
            </h1>
          </div>
          <Link
            href="/games/new"
            className="shrink-0 inline-flex items-center gap-1 h-8 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold tap hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Game
          </Link>
        </div>
      </header>

      <div className="pb-8">
        {live.length > 0 && (
          <Section label="Live" count={live.length} live>
            {live.map((g) => (
              <GameRow
                key={g.id}
                game={g}
                userId={userId}
                onDelete={handleDelete}
                deleting={deleteGame.isPending}
                showLiveBadge
              />
            ))}
          </Section>
        )}

        {upcoming.length > 0 && (
          <Section label="Upcoming" count={upcoming.length}>
            {upcoming.map((g) => (
              <GameRow
                key={g.id}
                game={g}
                userId={userId}
                onDelete={handleDelete}
                deleting={deleteGame.isPending}
              />
            ))}
          </Section>
        )}

        {completed.length > 0 && (
          <Section label="Completed" count={completed.length}>
            {completed.slice(0, 10).map((g) => (
              <GameRow
                key={g.id}
                game={g}
                userId={userId}
                onDelete={handleDelete}
                deleting={deleteGame.isPending}
              />
            ))}
          </Section>
        )}

        {!games.length && (
          <div className="border-y border-border px-6 py-14 text-center space-y-3">
            <p className="eyebrow">Empty schedule</p>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">
              No games yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Schedule a matchup and it&apos;ll show up here.
            </p>
            <div className="pt-2">
              <Link
                href="/games/new"
                className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
              >
                Schedule a game
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({
  label,
  count,
  live,
  children,
}: {
  label: string
  count?: number
  live?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="eyebrow">{label}</h2>
          {live && (
            <span
              className="block w-1.5 h-1.5 rounded-full bg-destructive"
              aria-hidden="true"
            />
          )}
        </div>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground tabular-nums font-semibold">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      <ul className="px-4 divide-y divide-border border-y border-border">
        {children}
      </ul>
    </section>
  )
}

const SWIPE_THRESHOLD = 80
const SWIPE_MAX = 100

interface GameRowProps {
  game: any
  userId: string | null
  onDelete: (id: string) => void
  deleting: boolean
  showLiveBadge?: boolean
}

function GameRow({ game, userId, onDelete, deleting, showLiveBadge }: GameRowProps) {
  const isCommissioner = userId && game.league?.commissioner_id === userId
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const startX = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (!isCommissioner) return
    startX.current = e.clientX
    setDragging(true)
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return
    const delta = startX.current - e.clientX
    if (delta < 0) { setOffset(0); return }
    setOffset(Math.min(delta, SWIPE_MAX))
  }

  function onPointerUp() {
    if (startX.current === null) return
    startX.current = null
    setDragging(false)
    if (offset >= SWIPE_THRESHOLD) {
      setOffset(SWIPE_MAX)
      setConfirming(true)
    } else {
      setOffset(0)
      setConfirming(false)
    }
  }

  function cancel() {
    setOffset(0)
    setConfirming(false)
  }

  const revealed = offset >= SWIPE_THRESHOLD

  return (
    <li className="relative overflow-hidden">
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 transition-colors ${
          revealed ? 'bg-destructive' : 'bg-destructive/60'
        }`}
        style={{ width: `${Math.max(offset, 0)}px` }}
        aria-hidden="true"
      >
        <Trash2 className="h-5 w-5 text-live-foreground shrink-0" />
      </div>

      <div
        ref={cardRef}
        style={{ transform: `translateX(-${offset}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="touch-pan-y select-none bg-background"
      >
        <GameCard game={game} showLiveBadge={showLiveBadge} />
      </div>

      {isCommissioner && confirming && (
        <div className="absolute inset-0 flex items-center justify-between gap-2 px-4 bg-background border-y border-destructive/40">
          <p className="text-sm font-semibold text-destructive">
            Delete this game?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={cancel}
              className="px-3 h-8 text-xs font-semibold rounded-full text-foreground tap hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(game.id)}
              disabled={deleting}
              className="px-3 h-8 text-xs font-semibold rounded-full bg-destructive text-live-foreground tap hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
