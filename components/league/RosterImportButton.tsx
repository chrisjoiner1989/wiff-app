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
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold tap text-foreground hover:bg-muted transition-colors"
      >
        <Upload className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
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
