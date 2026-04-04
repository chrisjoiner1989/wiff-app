import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type InsertTables, type UpdateTables, type Tables } from '@/types/database.types'

export const gameKeys = {
  all: ['games'] as const,
  list: (leagueId?: string) => [...gameKeys.all, 'list', leagueId] as const,
  detail: (id: string) => [...gameKeys.all, id] as const,
  lineups: (id: string) => [...gameKeys.all, id, 'lineups'] as const,
  atBats: (id: string) => [...gameKeys.all, id, 'at_bats'] as const,
  innings: (id: string) => [...gameKeys.all, id, 'innings'] as const,
}

export function useGames(leagueId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: gameKeys.list(leagueId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
          away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url)
        `)
        .eq('league_id', leagueId)
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!leagueId,
  })
}

export function useGame(id: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: gameKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
          away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
          league:leagues (id, name, rules_config)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useGameInnings(gameId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: gameKeys.innings(gameId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_innings')
        .select('*')
        .eq('game_id', gameId)
        .order('inning', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!gameId,
  })
}

export function useGameLineups(gameId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: gameKeys.lineups(gameId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_lineups')
        .select(`
          *,
          player:players (id, name, number, position)
        `)
        .eq('game_id', gameId)
        .order('batting_order', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!gameId,
  })
}

export function useGameAtBats(gameId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: gameKeys.atBats(gameId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('at_bats')
        .select(`
          *,
          batter:players!at_bats_batter_id_fkey (id, name, number),
          pitcher:players!at_bats_pitcher_id_fkey (id, name, number)
        `)
        .eq('game_id', gameId)
        .order('sequence_in_game', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!gameId,
  })
}

// Real-time subscription hook for spectator view
export function useRealtimeGame(gameId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useGame(gameId)

  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'at_bats', filter: `game_id=eq.${gameId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: gameKeys.atBats(gameId) })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_innings', filter: `game_id=eq.${gameId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: gameKeys.innings(gameId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, queryClient, supabase])

  return query
}

export function useCreateGame() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'games'>) => {
      const { data, error } = await supabase
        .from('games')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list(data.league_id) })
    },
  })
}

export function useUpdateGame(id: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: UpdateTables<'games'>) => {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: gameKeys.list(data.league_id) })
    },
  })
}

export function useRecordAtBat() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'at_bats'>) => {
      const { data, error } = await supabase
        .from('at_bats')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.atBats(data.game_id) })
    },
  })
}

export function useUpsertInning() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'game_innings'>) => {
      const { data, error } = await supabase
        .from('game_innings')
        .upsert(input, { onConflict: 'game_id,inning' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.innings(data.game_id) })
    },
  })
}
