import Link from 'next/link'
import { type Tables } from '@/types/database.types'
import { cn } from '@/lib/utils'

type GameWithTeams = Tables<'games'> & {
  home_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  away_team: { id: string; name: string; color_hex: string; logo_url: string | null }
  league?: { id: string; name: string }
}

interface GameCardProps {
  game: GameWithTeams
  showLiveBadge?: boolean
}

export function GameCard({ game, showLiveBadge }: GameCardProps) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const isScheduled = game.status === 'scheduled'

  const href = isLive ? `/games/${game.id}/live` : `/games/${game.id}`

  const winnerSide =
    isFinal && game.home_score !== game.away_score
      ? game.home_score > game.away_score
        ? 'home'
        : 'away'
      : null

  return (
    <Link
      href={href}
      className={cn(
        'group relative block rounded-md bg-card border border-border transition-all hover:border-foreground/30 hover:-translate-y-[1px]',
        isLive && 'border-stitch/50 hover:border-stitch'
      )}
    >
      {/* Top status rail */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {isLive && showLiveBadge && (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stitch opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-stitch" />
              </span>
              <span className="font-display font-800 text-[10px] tracking-[0.24em] uppercase text-stitch">
                Live
              </span>
            </span>
          )}
          {isFinal && (
            <span className="font-display font-800 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
              Final
            </span>
          )}
          {isScheduled && (
            <span className="font-display font-700 text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              {new Date(game.scheduled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' · '}
              {new Date(game.scheduled_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {isLive && (
          <span className="font-display font-700 text-[10px] tracking-[0.14em] uppercase text-muted-foreground tabular-nums">
            {game.current_half === 'top' ? '▲ Top' : '▼ Bot'} {game.current_inning}
          </span>
        )}
        {game.league && !isLive && (
          <span className="font-display font-600 text-[9px] tracking-[0.2em] uppercase text-muted-foreground truncate max-w-[40%]">
            {game.league.name}
          </span>
        )}
      </div>

      {/* Team rows */}
      <div className="px-3 pb-3 space-y-1">
        <TeamRow
          name={game.away_team.name}
          color={game.away_team.color_hex}
          score={game.away_score}
          showScore={isLive || isFinal}
          dim={winnerSide === 'home'}
          isWinner={winnerSide === 'away'}
        />
        <TeamRow
          name={game.home_team.name}
          color={game.home_team.color_hex}
          score={game.home_score}
          showScore={isLive || isFinal}
          dim={winnerSide === 'away'}
          isWinner={winnerSide === 'home'}
        />
      </div>
    </Link>
  )
}

function TeamRow({
  name,
  color,
  score,
  showScore,
  dim,
  isWinner,
}: {
  name: string
  color: string
  score: number
  showScore: boolean
  dim: boolean
  isWinner: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 transition-opacity',
        dim && 'opacity-55'
      )}
    >
      <span
        className="w-1 h-6 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="font-display font-700 text-sm tracking-wide uppercase flex-1 truncate">
        {name}
      </span>
      {showScore && (
        <span
          className={cn(
            'font-mono font-700 tabular-nums text-xl leading-none w-8 text-right',
            isWinner && 'text-stitch'
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}
