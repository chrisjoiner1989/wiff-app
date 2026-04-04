import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { type InsertTables, type UpdateTables } from '@/types/database.types'

export const teamKeys = {
  all: ['teams'] as const,
  detail: (id: string) => [...teamKeys.all, id] as const,
  roster: (id: string) => [...teamKeys.all, id, 'roster'] as const,
  stats: (id: string) => [...teamKeys.all, id, 'stats'] as const,
}

export function useTeam(id: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`*, league:leagues (id, name, season, rules_config)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useTeamRoster(teamId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.roster(teamId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('number', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!teamId,
  })
}

export function useCreateTeam() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'teams'>) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export function useAddPlayer() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'players'>) => {
      const { data, error } = await supabase
        .from('players')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.roster(data.team_id) })
    },
  })
}

export function useUpdatePlayer(playerId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: UpdateTables<'players'>) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.roster(data.team_id) })
    },
  })
}

export function useDeletePlayer() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ playerId, teamId }: { playerId: string; teamId: string }) => {
      const { error } = await supabase.from('players').delete().eq('id', playerId)
      if (error) throw error
      return { teamId }
    },
    onSuccess: ({ teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.roster(teamId) })
    },
  })
}
