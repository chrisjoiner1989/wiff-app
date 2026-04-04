import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { type Tables } from '@/types/database.types'

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

  return (
    <Link
      href={href}
      className="block p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Teams + score */}
        <div className="flex-1 space-y-1.5">
          <TeamRow
            name={game.away_team.name}
            color={game.away_team.color_hex}
            score={game.away_score}
            isLive={isLive || isFinal}
          />
          <TeamRow
            name={game.home_team.name}
            color={game.home_team.color_hex}
            score={game.home_score}
            isLive={isLive || isFinal}
          />
        </div>

        {/* Status / time column */}
        <div className="text-right shrink-0 space-y-1">
          {isLive && showLiveBadge && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              LIVE
            </Badge>
          )}
          {isLive && (
            <p className="text-xs text-muted-foreground">
              {game.current_half === 'top' ? '▲' : '▼'} {game.current_inning}
            </p>
          )}
          {isFinal && (
            <p className="text-xs text-muted-foreground font-medium">FINAL</p>
          )}
          {isScheduled && (
            <p className="text-xs text-muted-foreground">
              {new Date(game.scheduled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
          {game.league && (
            <p className="text-[10px] text-muted-foreground">{game.league.name}</p>
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
  isLive,
}: {
  name: string
  color: string
  score: number
  isLive: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-sm font-medium flex-1 truncate">{name}</span>
      {isLive && (
        <span className="text-sm font-display font-700 tabular-nums">{score}</span>
      )}
    </div>
  )
}
