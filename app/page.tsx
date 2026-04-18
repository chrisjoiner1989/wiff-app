import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/leagues')
  }

  return (
    <div className="relative min-h-screen overflow-hidden paper">
      {/* Faint scorecard grid in the corners — only visible at tablet+ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scorecard-grid opacity-40 md:opacity-60"
        style={{
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, black 100%)',
        }}
      />

      <div className="relative min-h-screen flex flex-col px-6 py-10 md:py-16 max-w-md md:max-w-3xl mx-auto">

        {/* Top pennant — establishment shot */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full bg-stitch"
            />
            <span className="font-display text-xs tracking-[0.28em] uppercase text-muted-foreground font-700">
              Est. 2026 &middot; Season I
            </span>
          </div>
          <span className="pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.24em] uppercase font-700 px-3 py-1.5 pr-5">
            Commissioner
          </span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 md:gap-10 w-full py-12">

          {/* Oversized scorecard-style mark */}
          <div className="animate-in fade-in zoom-in-95 duration-700 fill-mode-both">
            <div className="relative inline-flex items-baseline gap-1">
              <span className="font-display font-800 text-[7rem] md:text-[11rem] leading-[0.82] tracking-tight uppercase text-ink">
                Wiff
              </span>
              <span
                aria-hidden="true"
                className="font-display font-800 text-[7rem] md:text-[11rem] leading-[0.82] text-stitch"
              >
                .
              </span>
            </div>
          </div>

          {/* Stitch divider */}
          <div className="w-24 md:w-36 stitch-rule animate-in fade-in duration-500 delay-200 fill-mode-both" aria-hidden="true" />

          {/* Tagline — set like a scorecard subhead */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-600 delay-200 fill-mode-both">
            <p className="font-display text-base md:text-lg tracking-[0.22em] uppercase text-foreground font-700">
              Wiffle Ball. Kept Honest.
            </p>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-sm md:max-w-md mx-auto">
              Run the league, score the game, settle every argument with the box score.
            </p>
          </div>

          {/* Feature strip — lined up like a box score row */}
          <ul
            className="w-full max-w-md md:max-w-2xl grid grid-cols-3 divide-x divide-border border-y border-border py-4 md:py-5 animate-in fade-in slide-in-from-bottom-2 duration-600 delay-400 fill-mode-both"
          >
            {[
              { stat: 'Live', label: 'Pitch-by-Pitch' },
              { stat: 'Auto', label: 'Standings' },
              { stat: 'Paste', label: 'Roster Import' },
            ].map((f) => (
              <li key={f.label} className="flex flex-col items-center gap-1 px-2">
                <span className="font-display font-800 tabular-nums text-2xl md:text-3xl uppercase text-stitch tracking-wide">
                  {f.stat}
                </span>
                <span className="font-display text-[11px] md:text-xs tracking-[0.2em] uppercase text-muted-foreground font-700">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs — primary is ink, secondary is card-on-paper */}
        <div className="w-full max-w-sm md:max-w-md mx-auto flex flex-col md:flex-row gap-3 animate-in fade-in slide-in-from-bottom-3 duration-600 delay-600 fill-mode-both">
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center h-12 md:h-14 rounded-md bg-primary text-primary-foreground font-display font-700 text-sm md:text-base tracking-[0.28em] uppercase hover:bg-ink/90 active:scale-[0.98] transition-all"
          >
            Step Up
          </Link>
          <Link
            href="/login?mode=signup"
            className="flex-1 flex items-center justify-center h-12 md:h-14 rounded-md bg-card ring-1 ring-border font-display font-700 text-sm md:text-base tracking-[0.28em] uppercase text-foreground hover:ring-stitch/40 active:scale-[0.98] transition-all"
          >
            Start a League
          </Link>
        </div>

        {/* Footer mark */}
        <p className="mt-8 md:mt-10 text-center font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground/70 font-600">
          No Leading Off &nbsp;&bull;&nbsp; No Stealing &nbsp;&bull;&nbsp; Honor the Mat
        </p>
      </div>
    </div>
  )
}
