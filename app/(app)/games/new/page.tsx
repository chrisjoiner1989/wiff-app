'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const schema = z.object({
  league_id: z.string().uuid(),
  home_team_id: z.string().uuid(),
  away_team_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  field_location: z.string().optional(),
}).refine((d) => d.home_team_id !== d.away_team_id, {
  message: 'Home and away teams must be different',
  path: ['away_team_id'],
})

type FormValues = z.infer<typeof schema>

function NewGameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultLeagueId = searchParams.get('leagueId') ?? ''
  const [loading, setLoading] = useState(false)
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { league_id: defaultLeagueId },
  })

  const selectedLeague = watch('league_id')

  // Load commissioner's leagues
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('leagues')
        .select('id, name')
        .eq('commissioner_id', user.id)
        .then(({ data }) => setLeagues(data ?? []))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load teams for selected league
  useEffect(() => {
    if (!selectedLeague) { setTeams([]); return }
    supabase
      .from('teams')
      .select('id, name')
      .eq('league_id', selectedLeague)
      .then(({ data }) => setTeams(data ?? []))
  }, [selectedLeague]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { data, error } = await supabase
      .from('games')
      .insert({
        league_id: values.league_id,
        home_team_id: values.home_team_id,
        away_team_id: values.away_team_id,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        field_location: values.field_location || null,
        status: 'scheduled',
      })
      .select()
      .single()
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Game scheduled!')
    router.push(`/games/${data.id}`)
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      <header className="px-1">
        <p className="text-sm text-muted-foreground font-medium">New</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-0.5">Schedule game</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a game to your league.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Game info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>League</Label>
              <Select
                defaultValue={defaultLeagueId || undefined}
                onValueChange={(v) => setValue('league_id', v as string)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.league_id && <p className="text-xs text-destructive">League is required</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Away team</Label>
              <Select
                onValueChange={(v) => setValue('away_team_id', v as string)}
                disabled={teams.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select away team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.away_team_id && <p className="text-xs text-destructive">{errors.away_team_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Home team</Label>
              <Select
                onValueChange={(v) => setValue('home_team_id', v as string)}
                disabled={teams.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.home_team_id && <p className="text-xs text-destructive">Home team is required</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduled_at">Date & time</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                {...register('scheduled_at')}
              />
              {errors.scheduled_at && <p className="text-xs text-destructive">Date is required</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field_location">Field (optional)</Label>
              <Input
                id="field_location"
                placeholder="Backyard, 123 Main St"
                {...register('field_location')}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Scheduling…' : 'Schedule game'}
        </Button>
      </form>
    </div>
  )
}

export default function NewGamePage() {
  return (
    <Suspense>
      <NewGameForm />
    </Suspense>
  )
}
