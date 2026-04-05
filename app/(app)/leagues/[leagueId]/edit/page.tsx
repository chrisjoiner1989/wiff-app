'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUpdateLeague, useDeleteLeague } from '@/lib/queries/leagues'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_RULES } from '@/lib/wiffle/rulesEngine'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  name: z.string().min(2, 'League name must be at least 2 characters'),
  season: z.string().min(1, 'Season is required'),
  innings: z.coerce.number().int().min(1).max(15),
  strike_zone_type: z.enum(['mat', 'ump', 'honor']),
  mercy_rule_runs: z.coerce.number().int().min(0),
  mercy_rule_after_inning: z.coerce.number().int().min(1),
  pitching_distance_ft: z.coerce.number().min(20).max(100),
  foul_balls_for_out: z.coerce.number().int().min(1).max(10),
})

type FormValues = z.infer<typeof schema>

export default function EditLeaguePage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const router = useRouter()
  const supabase = createClient()

  const [league, setLeague] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateLeague = useUpdateLeague(leagueId)
  const deleteLeague = useDeleteLeague()

  const { register, handleSubmit, setValue, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single()
      if (error || !data) { toast.error('League not found'); router.replace('/leagues'); return }

      // verify commissioner
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id !== data.commissioner_id) { toast.error('Not authorized'); router.replace(`/leagues/${leagueId}`); return }

      setLeague(data)
      const r = data.rules_config as any
      reset({
        name: data.name,
        season: data.season,
        innings: r?.innings ?? DEFAULT_RULES.innings,
        strike_zone_type: r?.strike_zone_type ?? DEFAULT_RULES.strike_zone_type,
        mercy_rule_runs: r?.mercy_rule_runs ?? DEFAULT_RULES.mercy_rule_runs,
        mercy_rule_after_inning: r?.mercy_rule_after_inning ?? DEFAULT_RULES.mercy_rule_after_inning,
        pitching_distance_ft: r?.pitching_distance_ft ?? DEFAULT_RULES.pitching_distance_ft,
        foul_balls_for_out: r?.foul_balls_for_out ?? DEFAULT_RULES.foul_balls_for_out,
      })
      setLoading(false)
    }
    load()
  }, [leagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    await updateLeague.mutateAsync({
      name: values.name,
      season: values.season,
      rules_config: {
        ...DEFAULT_RULES,
        innings: values.innings,
        strike_zone_type: values.strike_zone_type,
        mercy_rule_runs: values.mercy_rule_runs,
        mercy_rule_after_inning: values.mercy_rule_after_inning,
        pitching_distance_ft: values.pitching_distance_ft,
        foul_balls_for_out: values.foul_balls_for_out,
      },
    }, {
      onSuccess: () => {
        toast.success('League updated')
        router.push(`/leagues/${leagueId}`)
      },
      onError: (e: any) => toast.error(e.message),
    })
  }

  async function handleDelete() {
    await deleteLeague.mutateAsync(leagueId, {
      onSuccess: () => {
        toast.success('League deleted')
        router.replace('/leagues')
      },
      onError: (e: any) => toast.error(e.message),
    })
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <header>
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="inline h-3 w-3" />Back
        </button>
        <h1 className="font-display text-4xl font-800 tracking-tight">EDIT LEAGUE</h1>
        <p className="text-muted-foreground text-sm">{league?.name}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg tracking-wide">League Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">League Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="season">Season</Label>
              <Input id="season" {...register('season')} />
              {errors.season && <p className="text-xs text-destructive">{errors.season.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg tracking-wide">Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="innings">Innings</Label>
                <Input id="innings" type="number" {...register('innings')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pitching_distance_ft">Pitching Distance (ft)</Label>
                <Input id="pitching_distance_ft" type="number" {...register('pitching_distance_ft')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Strike Zone Type</Label>
              <Select
                defaultValue={league?.rules_config?.strike_zone_type ?? 'mat'}
                onValueChange={(v) => setValue('strike_zone_type', v as 'mat' | 'ump' | 'honor', { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mat">Strike Zone Mat</SelectItem>
                  <SelectItem value="ump">Live Umpire</SelectItem>
                  <SelectItem value="honor">Honor System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mercy_rule_runs">Mercy Rule (runs)</Label>
                <Input id="mercy_rule_runs" type="number" {...register('mercy_rule_runs')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mercy_rule_after_inning">After Inning</Label>
                <Input id="mercy_rule_after_inning" type="number" {...register('mercy_rule_after_inning')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="foul_balls_for_out">Foul Balls for Out</Label>
              <Input id="foul_balls_for_out" type="number" {...register('foul_balls_for_out')} />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 font-display text-lg font-700 tracking-wide"
          disabled={updateLeague.isPending || !isDirty}
        >
          {updateLeague.isPending ? 'Saving…' : 'SAVE CHANGES'}
        </Button>
      </form>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg tracking-wide text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {!confirmDelete ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Delete League
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive font-medium">
                This will permanently delete the league, all teams, games, and stats. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteLeague.isPending}
                  onClick={handleDelete}
                >
                  {deleteLeague.isPending ? 'Deleting…' : 'Yes, Delete'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
