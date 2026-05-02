'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_RULES } from '@/lib/wiffle/rulesEngine'

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

export default function NewLeaguePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      innings: DEFAULT_RULES.innings,
      strike_zone_type: DEFAULT_RULES.strike_zone_type,
      mercy_rule_runs: DEFAULT_RULES.mercy_rule_runs,
      mercy_rule_after_inning: DEFAULT_RULES.mercy_rule_after_inning,
      pitching_distance_ft: DEFAULT_RULES.pitching_distance_ft,
      foul_balls_for_out: DEFAULT_RULES.foul_balls_for_out,
      season: `${new Date().getFullYear()} Season`,
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not signed in'); setLoading(false); return }

    const { data, error } = await supabase
      .from('leagues')
      .insert({
        name: values.name,
        season: values.season,
        commissioner_id: user.id,
        rules_config: {
          ...DEFAULT_RULES,
          innings: values.innings,
          strike_zone_type: values.strike_zone_type,
          mercy_rule_runs: values.mercy_rule_runs,
          mercy_rule_after_inning: values.mercy_rule_after_inning,
          pitching_distance_ft: values.pitching_distance_ft,
          foul_balls_for_out: values.foul_balls_for_out,
        },
      })
      .select()
      .single()

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('League created!')
    router.push(`/leagues/${data.id}`)
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      <header className="px-1">
        <p className="text-sm text-muted-foreground font-medium">New</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-0.5">Create league</h1>
        <p className="text-sm text-muted-foreground mt-1">Set up the basics — you can tune rules anytime.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>League info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">League name</Label>
              <Input id="name" placeholder="Backyard Bombers League" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="season">Season</Label>
              <Input id="season" placeholder="2025 Summer Season" {...register('season')} />
              {errors.season && <p className="text-xs text-destructive">{errors.season.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="innings">Innings</Label>
                <Input id="innings" type="number" {...register('innings')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pitching_distance_ft">Pitching distance (ft)</Label>
                <Input id="pitching_distance_ft" type="number" {...register('pitching_distance_ft')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Strike zone</Label>
              <Select
                defaultValue="mat"
                onValueChange={(v) => setValue('strike_zone_type', v as 'mat' | 'ump' | 'honor')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mat">Strike zone mat</SelectItem>
                  <SelectItem value="ump">Live umpire</SelectItem>
                  <SelectItem value="honor">Honor system</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mercy_rule_runs">Mercy rule (runs)</Label>
                <Input id="mercy_rule_runs" type="number" {...register('mercy_rule_runs')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mercy_rule_after_inning">After inning</Label>
                <Input id="mercy_rule_after_inning" type="number" {...register('mercy_rule_after_inning')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="foul_balls_for_out">Foul balls for out</Label>
              <Input id="foul_balls_for_out" type="number" {...register('foul_balls_for_out')} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create league'}
        </Button>
      </form>
    </div>
  )
}
