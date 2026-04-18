'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
              Scorecard
            </p>
            <h1 className="font-display text-5xl font-800 tracking-tight uppercase mt-0.5 leading-none">
              Games<span className="text-stitch">.</span>
            </h1>
          </div>
          <Link
            href="/games/new"
            className="shrink-0 inline-flex items-center h-9 px-3 rounded-md bg-primary text-primary-foreground font-display font-700 text-xs tracking-[0.18em] uppercase hover:bg-foreground/85 transition"
          >
            + Game
          </Link>
        </div>
        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />
      </header>

      <div className="px-4 pb-6 space-y-6">
        {live.length > 0 && (
          <section>
            <SectionHead label="Live Now" accent count={live.length} />
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
            <SectionHead label="On Deck" count={upcoming.length} />
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
            <SectionHead label="In the Books" count={completed.length} />
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
          <div className="relative rounded-md border border-border bg-card overflow-hidden mt-4">
            <div aria-hidden="true" className="stitch-rule opacity-80" />
            <div className="p-8 text-center space-y-3">
              <span className="inline-block pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.28em] uppercase font-800 px-3 py-1.5 pr-6">
                Warmups
              </span>
              <h2 className="font-display text-2xl font-800 tracking-tight uppercase leading-tight">
                No games yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Schedule a game and it'll land on the card.
              </p>
              <Link
                href="/games/new"
                className="inline-flex items-center justify-center h-11 px-6 mt-2 rounded-md bg-stitch text-stitch-foreground font-display font-700 text-sm tracking-[0.22em] uppercase hover:bg-stitch/90 transition"
              >
                Schedule a Game
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHead({
  label,
  count,
  accent,
}: {
  label: string
  count?: number
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`inline-block w-1 h-3.5 rounded-sm ${accent ? 'bg-stitch' : 'bg-foreground'}`}
        />
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
    <div className="relative overflow-hidden rounded-md">
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 rounded-md transition-colors ${
          revealed ? 'bg-stitch' : 'bg-stitch/60'
        }`}
        style={{ width: `${Math.max(offset, 0)}px` }}
        aria-hidden="true"
      >
        <Trash2 className="h-5 w-5 text-stitch-foreground shrink-0" />
      </div>

      <div
        ref={cardRef}
        style={{ transform: `translateX(-${offset}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="touch-pan-y select-none"
      >
        <GameCard game={game} showLiveBadge={showLiveBadge} />
      </div>

      {isCommissioner && confirming && (
        <div className="absolute inset-0 flex items-center justify-between gap-2 px-3 rounded-md bg-card border border-stitch/60">
          <p className="font-display text-xs tracking-[0.18em] uppercase font-700 text-stitch">
            Delete this game?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={cancel}
              className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-display font-700 rounded-md ring-1 ring-border hover:ring-foreground/30 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(game.id)}
              disabled={deleting}
              className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase font-display font-700 rounded-md bg-stitch text-stitch-foreground hover:bg-stitch/90 disabled:opacity-50 transition"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
