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
      className="group relative block px-4 py-3 -mx-4 row-hover tap"
    >
      <div className="flex items-center gap-4">
        {/* Teams column */}
        <div className="flex-1 min-w-0 space-y-1">
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

        {/* Status column — fixed width for alignment */}
        <div className="shrink-0 w-16 flex flex-col items-end gap-1">
          {isLive && showLiveBadge && <span className="live-pill">Live</span>}
          {isLive && !showLiveBadge && (
            <span className="eyebrow text-destructive">Live</span>
          )}
          {isFinal && <span className="eyebrow">Final</span>}
          {isScheduled && (
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums leading-tight text-right">
              {new Date(game.scheduled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              <br />
              {new Date(game.scheduled_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}

          {isLive && (
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
              {game.current_half === 'top' ? '▲' : '▼'} {game.current_inning}
            </span>
          )}
          {game.league && isFinal && (
            <span className="text-[10px] text-muted-foreground truncate max-w-full">
              {game.league.name}
            </span>
          )}
        </div>
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
        dim && 'opacity-40'
      )}
    >
      <span
        className="w-1 h-4 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'text-[15px] flex-1 truncate leading-tight',
          isWinner ? 'font-semibold text-foreground' : 'font-medium'
        )}
      >
        {name}
      </span>
      {showScore && (
        <span
          className={cn(
            'scoreboard text-2xl leading-none w-9 text-right',
            isWinner && 'text-foreground',
            !isWinner && !dim && 'text-muted-foreground'
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}
