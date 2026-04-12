'use client'


import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { useCreateTeam } from '@/lib/queries/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name too long'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #1e3a5f'),
})
type FormValues = z.infer<typeof schema>

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#1e3a5f', '#1c1c1e', '#6b7280', '#ffffff',
]

export default function NewTeamPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const router = useRouter()
  const createTeam = useCreateTeam()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: '#1e3a5f' },
  })
  const color = watch('color')

  async function onSubmit(values: FormValues) {
    await createTeam.mutateAsync(
      { league_id: leagueId, name: values.name.trim(), color_hex: values.color },
      {
        onSuccess: (team) => {
          toast.success(`${team.name} created`)
          router.push(`/teams/${team.id}/edit`)
        },
        onError: (e: any) => toast.error(e.message),
      }
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
        <h1 className="font-display text-4xl font-800 tracking-tight">ADD TEAM</h1>
        <p className="text-muted-foreground text-sm">Create a new team for this league</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg tracking-wide">Team Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Yard Bombers"
                {...register('name')}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Team Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c, { shouldValidate: true })}
                    className="h-10 rounded-md border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? 'hsl(var(--primary))' : 'transparent',
                      outline: color === c ? '2px solid hsl(var(--primary))' : 'none',
                      outlineOffset: '2px',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div
                  className="w-10 h-10 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : 'transparent' }}
                  aria-hidden="true"
                />
                <Input
                  placeholder="#1e3a5f"
                  className="font-mono text-sm"
                  maxLength={7}
                  {...register('color')}
                />
              </div>
              {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 font-display text-lg font-700 tracking-wide"
          disabled={createTeam.isPending}
        >
          {createTeam.isPending ? 'Creating…' : 'CREATE TEAM'}
        </Button>
      </form>
    </div>
  )
}
