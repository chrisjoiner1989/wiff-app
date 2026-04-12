import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WiffIcon from '@/assets/wiff-icon.svg'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/leagues')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background overflow-hidden px-6 py-12">
      {/* Top spacer */}
      <div />

      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center w-56 h-56 mb-8">
          <div
            className="absolute w-56 h-56 rounded-full border border-primary/10 animate-[spin_18s_linear_infinite]"
            aria-hidden="true"
          />
          <div
            className="absolute w-40 h-40 rounded-full border border-primary/15 animate-[spin_12s_linear_infinite_reverse]"
            aria-hidden="true"
          />
          <div
            className="absolute w-28 h-28 rounded-full border border-primary/25 animate-[spin_8s_linear_infinite]"
            aria-hidden="true"
          />
          {/* Glow */}
          <div
            className="absolute w-24 h-24 rounded-full bg-primary/15 blur-2xl animate-pulse"
            aria-hidden="true"
          />
          {/* Icon */}
          <div className="relative animate-in fade-in zoom-in-75 duration-700 fill-mode-both">
            <WiffIcon
              className="w-20 h-20 drop-shadow-[0_0_28px_oklch(0.97_0_0/0.3)]"
              width={undefined}
              height={undefined}
              aria-label="WIFF"
            />
          </div>
        </div>

        {/* Title */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
          <p className="font-display text-base font-700 tracking-widest text-muted-foreground mt-2 uppercase">
            Wiffle Ball League Manager
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-1.5 mt-6 animate-in fade-in duration-500 delay-300 fill-mode-both">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="w-1 h-1 rounded-full bg-primary/40" />
        </div>

        {/* Feature pills */}
        <div className="mt-8 space-y-2 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
          {[
            { label: 'Live Scoring', sub: 'Track every at-bat in real time' },
            { label: 'Standings', sub: 'Auto-updated after every game' },
            { label: 'Roster Import', sub: 'Paste or scan your lineup' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left"
            >
              <span className="w-1.5 h-6 rounded-full bg-primary shrink-0" />
              <div>
                <p className="font-display font-700 text-sm tracking-wide">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="w-full max-w-xs flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700 fill-mode-both">
        <Link
          href="/login"
          className="flex items-center justify-center h-13 bg-primary text-primary-foreground rounded-xl font-display font-700 text-lg tracking-wide hover:opacity-90 transition-opacity"
        >
          SIGN IN
        </Link>
        <Link
          href="/login?mode=signup"
          className="flex items-center justify-center h-13 bg-card border border-border rounded-xl font-display font-700 text-base tracking-wide text-foreground hover:border-primary/50 transition-colors"
        >
          CREATE ACCOUNT
        </Link>
      </div>
    </div>
  )
}
