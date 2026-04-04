import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { type InsertTables, type UpdateTables } from '@/types/database.types'

const supabase = createClient()

export const leagueKeys = {
  all: ['leagues'] as const,
  list: () => [...leagueKeys.all, 'list'] as const,
  detail: (id: string) => [...leagueKeys.all, id] as const,
  standings: (id: string) => [...leagueKeys.all, id, 'standings'] as const,
}

export function useLeagues() {
  return useQuery({
    queryKey: leagueKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useLeague(id: string) {
  return useQuery({
    queryKey: leagueKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          *,
          teams (
            id, name, logo_url, color_hex
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useLeagueStandings(leagueId: string) {
  return useQuery({
    queryKey: leagueKeys.standings(leagueId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standings')
        .select('*')
        .eq('league_id', leagueId)
      if (error) throw error
      return data
    },
    enabled: !!leagueId,
  })
}

export function useCreateLeague() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InsertTables<'leagues'>) => {
      const { data, error } = await supabase
        .from('leagues')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.list() })
    },
  })
}

export function useUpdateLeague(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: UpdateTables<'leagues'>) => {
      const { data, error } = await supabase
        .from('leagues')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: leagueKeys.list() })
    },
  })
}
