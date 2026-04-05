import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScorekeeperClient } from './ScorekeeperClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ gameId: string }>
}

export default async function ScorePage({ params }: Props) {
  const { gameId } = await params
  const supabase = await createClient()

  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
      away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
      league:leagues (id, name, rules_config, commissioner_id)
    `)
    .eq('id', gameId)
    .single()

  if (error || !game) redirect('/')

  const { data: lineups } = await supabase
    .from('game_lineups')
    .select(`*, player:players (id, name, number, position)`)
    .eq('game_id', gameId)
    .order('batting_order')

  const { data: innings } = await supabase
    .from('game_innings')
    .select('*')
    .eq('game_id', gameId)
    .order('inning')

  return (
    <ScorekeeperClient
      game={game as any}
      lineups={(lineups ?? []) as any}
      innings={innings ?? []}
    />
  )
}
