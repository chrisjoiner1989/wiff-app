import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/leagues')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background px-6 py-16 md:py-24 overflow-hidden">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 md:gap-10 w-full">

        {/* Logo with glow + fade-in */}
        <div className="relative flex items-center justify-center animate-in fade-in zoom-in-90 duration-700 fill-mode-both">
          {/* Soft glow halo */}
          <div
            className="absolute w-36 h-36 md:w-52 md:h-52 rounded-full bg-primary/10 blur-3xl animate-pulse"
            style={{ animationDuration: '3s' }}
            aria-hidden="true"
          />
          <Image
            src="/icons/icon-192.png"
            width={96}
            height={96}
            alt="WIFF"
            priority
            className="relative md:w-32 md:h-32 rounded-[22px] md:rounded-[28px] drop-shadow-[0_0_32px_oklch(0.97_0_0/0.18)]"
          />
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-600 delay-200 fill-mode-both">
          <h1 className="font-display font-800 text-5xl md:text-7xl tracking-widest uppercase leading-none">
            Wiff
          </h1>
          <p className="font-display text-sm md:text-base font-600 tracking-[0.25em] text-muted-foreground uppercase">
            Wiffle Ball League Manager
          </p>
        </div>

        {/* Dot divider */}
        <div className="flex items-center gap-1.5 animate-in fade-in duration-500 delay-400 fill-mode-both">
          <span className="w-1 h-1 rounded-full bg-primary/30" aria-hidden="true" />
          <span className="w-2 h-2 rounded-full bg-primary/60" aria-hidden="true" />
          <span className="w-1 h-1 rounded-full bg-primary/30" aria-hidden="true" />
        </div>

        {/* Feature list — stacked on mobile, row on tablet */}
        <ul className="w-full max-w-xs md:max-w-2xl md:grid md:grid-cols-3 space-y-2.5 md:space-y-0 md:gap-4 animate-in fade-in slide-in-from-bottom-3 duration-600 delay-500 fill-mode-both">
          {[
            { label: 'Live Scoring', sub: 'Track every at-bat in real time' },
            { label: 'Standings', sub: 'Auto-updated after every game' },
            { label: 'Roster Import', sub: 'Paste or scan your lineup' },
          ].map((f) => (
            <li
              key={f.label}
              className="flex items-center gap-3 px-4 py-3 md:py-5 rounded-xl bg-card ring-1 ring-foreground/8 text-left"
            >
              <span className="w-1 h-5 md:h-7 rounded-full bg-primary/60 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-display font-700 text-sm md:text-base tracking-wide">{f.label}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{f.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA buttons — stacked on mobile, side-by-side on tablet */}
      <div className="w-full max-w-xs md:max-w-sm flex flex-col md:flex-row gap-3 pt-10 md:pt-14 animate-in fade-in slide-in-from-bottom-4 duration-600 delay-700 fill-mode-both">
        <Link
          href="/login"
          className="flex-1 flex items-center justify-center h-12 md:h-13 rounded-xl bg-primary text-primary-foreground font-display font-700 text-base tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Sign In
        </Link>
        <Link
          href="/login?mode=signup"
          className="flex-1 flex items-center justify-center h-12 md:h-13 rounded-xl bg-card ring-1 ring-foreground/10 font-display font-700 text-base tracking-widest uppercase text-foreground hover:ring-foreground/25 active:scale-[0.98] transition-all"
        >
          Create Account
        </Link>
      </div>

    </div>
  )
}
