'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { RosterImportDialog } from './RosterImportDialog'

export function RosterImportButton({ leagueId }: { leagueId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
      >
        <Upload className="h-3 w-3" aria-hidden="true" />
        Import
      </button>
      <RosterImportDialog
        leagueId={leagueId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => { setOpen(false); router.refresh() }}
      />
    </>
  )
}
