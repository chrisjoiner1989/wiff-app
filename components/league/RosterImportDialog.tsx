'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toDraft, type DraftRoster, type RosterImportResponse } from '@/lib/roster-import/schema'
import { RosterPreview } from './RosterPreview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Step = 'input' | 'loading' | 'preview' | 'saving'
type Tab = 'text' | 'photo'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB

interface Props {
  leagueId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RosterImportDialog({ leagueId, open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftRoster | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleReset() {
    setStep('input')
    setText('')
    setImageFile(null)
    setImagePreview(null)
    setDraft(null)
  }

  function handleClose(open: boolean) {
    if (!open) handleReset()
    onOpenChange(open)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be under 4MB')
      return
    }
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  async function handleParse() {
    setStep('loading')
    try {
      const formData = new FormData()

      if (tab === 'text') {
        if (!text.trim()) { setStep('input'); return }
        formData.set('type', 'text')
        formData.set('text', text)
      } else {
        if (!imageFile) { setStep('input'); return }
        const base64 = await fileToBase64(imageFile)
        formData.set('type', 'image')
        formData.set('base64', base64)
        formData.set('mimeType', imageFile.type || 'image/jpeg')
      }

      const res = await fetch('/api/roster-import', { method: 'POST', body: formData })
      const json: RosterImportResponse = await res.json()

      if (!json.ok) {
        toast.error(json.error)
        setStep('input')
        return
      }

      setDraft(toDraft(json.data))
      setStep('preview')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setStep('input')
    }
  }

  async function handleConfirm() {
    if (!draft) return
    setStep('saving')

    const results: { teamName: string; ok: boolean; error?: string }[] = []

    for (const team of draft.teams) {
      try {
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            league_id: leagueId,
            name: team.name.trim(),
            color_hex: team.color_hex ?? undefined,
          })
          .select()
          .single()

        if (teamError) throw teamError

        const playerRows = team.players
          .filter((p) => p.name.trim())
          .map((p) => ({
            team_id: newTeam.id,
            name: p.name.trim(),
            number: p.number || null,
            position: p.position || null,
          }))

        if (playerRows.length > 0) {
          const { error: playersError } = await supabase.from('players').insert(playerRows)
          if (playersError) throw playersError
        }

        results.push({ teamName: team.name, ok: true })
      } catch (err: unknown) {
        results.push({
          teamName: team.name,
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const failed = results.filter((r) => !r.ok)
    if (failed.length === 0) {
      toast.success(`${results.length} team${results.length !== 1 ? 's' : ''} imported`)
    } else {
      const succeeded = results.length - failed.length
      toast.warning(
        `${succeeded} team${succeeded !== 1 ? 's' : ''} imported. Failed: ${failed.map((f) => f.teamName).join(', ')}`
      )
    }

    onSuccess()
  }

  const canParse = tab === 'text' ? text.trim().length > 0 : imageFile !== null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            {step === 'preview' ? 'Review Roster' : 'Import Roster'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Input step */}
          {(step === 'input' || step === 'loading') && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                    tab === 'text'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setTab('photo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                    tab === 'photo'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Upload Photo
                </button>
              </div>

              {tab === 'text' ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Paste your roster — any format works. Example: team names, player names, numbers, and positions.
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={"Team Alpha\n1 John Smith P\n7 Jane Doe SS\n\nTeam Beta\n4 Mike Johnson 1B"}
                    className="w-full h-48 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={step === 'loading'}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Take or upload a photo of a handwritten roster. Max 4MB.
                  </p>
                  {imagePreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Roster preview"
                        className="w-full rounded-md border border-border object-contain max-h-48"
                      />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="absolute top-2 right-2 bg-background/80 rounded px-2 py-0.5 text-xs border border-border hover:bg-background"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-md border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Tap to choose photo</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Parsing roster…</p>
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && draft && (
            <RosterPreview draft={draft} onChange={setDraft} />
          )}

          {/* Saving state */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Saving teams and players…</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleParse} disabled={!canParse}>
                Parse Roster
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>Back</Button>
              <Button onClick={handleConfirm} disabled={!draft?.teams.length}>
                Confirm & Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix: "data:image/jpeg;base64,..."
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
