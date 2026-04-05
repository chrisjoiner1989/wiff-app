import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LiveSpectatorClient } from './LiveSpectatorClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ gameId: string }>
}

export default async function LivePage({ params }: Props) {
  const { gameId } = await params
  const supabase = await createClient()

  const { data: game } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
      away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
      league:leagues (id, name, rules_config)
    `)
    .eq('id', gameId)
    .single()

  if (!game) notFound()

  const { data: innings } = await supabase
    .from('game_innings')
    .select('*')
    .eq('game_id', gameId)
    .order('inning')

  const { data: atBats } = await supabase
    .from('at_bats')
    .select(`
      *,
      batter:players!at_bats_batter_id_fkey (id, name, number),
      pitcher:players!at_bats_pitcher_id_fkey (id, name, number)
    `)
    .eq('game_id', gameId)
    .order('sequence_in_game', { ascending: false })
    .limit(20)

  return (
    <LiveSpectatorClient
      game={game as any}
      innings={innings ?? []}
      recentAtBats={(atBats ?? []) as any}
    />
  )
}
