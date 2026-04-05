'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CircleDot, Trash2 } from 'lucide-react'
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
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-4xl font-800 tracking-tight">GAMES</h1>
          <p className="text-muted-foreground text-sm">All games</p>
        </div>
        <Link
          href="/games/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          + Game
        </Link>
      </header>

      {live.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            LIVE
          </h2>
          <div className="space-y-2">
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
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">UPCOMING</h2>
          <div className="space-y-2">
            {upcoming.map((g) => (
              <GameRow
                key={g.id}
                game={g}
                userId={userId}
                onDelete={handleDelete}
                deleting={deleteGame.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-700 tracking-wide mb-3">COMPLETED</h2>
          <div className="space-y-2">
            {completed.slice(0, 10).map((g) => (
              <GameRow
                key={g.id}
                game={g}
                userId={userId}
                onDelete={handleDelete}
                deleting={deleteGame.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {!games.length && (
        <div className="text-center py-16 space-y-3">
          <CircleDot className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="font-display text-2xl font-700 tracking-wide">NO GAMES YET</p>
          <Link
            href="/games/new"
            className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
          >
            Schedule a Game
          </Link>
        </div>
      )}
    </div>
  )
}

const SWIPE_THRESHOLD = 80  // px to trigger delete
const SWIPE_MAX = 100       // max drag distance

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
  const [confirming, setConfirming] = useState(false)
  const startX = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (!isCommissioner) return
    startX.current = e.clientX
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
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 rounded-lg transition-colors ${
          revealed ? 'bg-destructive' : 'bg-destructive/60'
        }`}
        style={{ width: `${Math.max(offset, 0)}px` }}
        aria-hidden="true"
      >
        <Trash2 className="h-5 w-5 text-white shrink-0" />
      </div>

      {/* Card (slides left) */}
      <div
        ref={cardRef}
        style={{ transform: `translateX(-${offset}px)`, transition: startX.current ? 'none' : 'transform 0.2s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="touch-pan-y select-none"
      >
        <GameCard game={game} showLiveBadge={showLiveBadge} />
      </div>

      {/* Confirm overlay */}
      {isCommissioner && confirming && (
        <div className="absolute inset-0 flex items-center justify-between gap-2 px-3 rounded-lg bg-card border border-destructive/50">
          <p className="text-sm text-destructive font-medium">Delete this game?</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={cancel}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(game.id)}
              disabled={deleting}
              className="px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground font-medium disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
