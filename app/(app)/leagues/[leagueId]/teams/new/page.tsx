'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { useCreateTeam } from '@/lib/queries/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#1e3a5f', '#1c1c1e', '#6b7280', '#ffffff',
]

export default function NewTeamPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const router = useRouter()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#1e3a5f')
  const createTeam = useCreateTeam()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createTeam.mutateAsync(
      { league_id: leagueId, name: name.trim(), color_hex: color },
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Team Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
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
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#1e3a5f"
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 font-display text-lg font-700 tracking-wide"
          disabled={createTeam.isPending || !name.trim()}
        >
          {createTeam.isPending ? 'Creating…' : 'CREATE TEAM'}
        </Button>
      </form>
    </div>
  )
}
