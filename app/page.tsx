import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/leagues')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-45 motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/video/hero-batting.mp4" type="video/mp4" />
      </video>

      {/* Layered gradient + grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-neutral-950/55 to-neutral-950"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(0,0,0,0.7)_100%)]"
      />

      <div className="relative min-h-screen flex flex-col px-6 py-8 md:py-12 max-w-md md:max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-baseline gap-0.5">
            <span className="text-xl font-bold tracking-tight">Wiff</span>
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mb-0.5"
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Season &rsquo;26
          </span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-start justify-center gap-7 w-full py-12">
          <span className="inline-flex items-center gap-2">
            <span className="block w-1 h-1 rounded-full bg-destructive" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-destructive">
              Live wiffle ball
            </span>
          </span>

          <h1 className="text-[44px] md:text-6xl font-bold tracking-[-0.035em] leading-[0.95] text-white max-w-md">
            Backyard ball,
            <br />
            <span className="text-white/55">properly</span> scored.
          </h1>

          <p className="text-[15px] text-white/70 max-w-sm leading-relaxed">
            Score live, track stats, settle debates. Everything your league needs, nothing you don&rsquo;t.
          </p>

          {/* Stats strip */}
          <ul className="grid grid-cols-3 gap-px bg-white/10 w-full max-w-md rounded-md overflow-hidden">
            {[
              { stat: 'Live', label: 'Pitch by pitch' },
              { stat: 'Auto', label: 'Standings' },
              { stat: 'Paste', label: 'Roster import' },
            ].map((f) => (
              <li
                key={f.label}
                className="flex flex-col items-center gap-1 py-3.5 bg-neutral-950/60 backdrop-blur-sm"
              >
                <span className="scoreboard text-base text-white">{f.stat}</span>
                <span className="text-[9.5px] text-white/55 font-semibold uppercase tracking-[0.1em] text-center px-1">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-2">
          <Link
            href="/login?mode=signup"
            className="group flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-white text-neutral-950 font-semibold text-[15px] tap transition-colors hover:bg-white/90"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
          </Link>
          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center h-12 rounded-full text-white font-semibold text-[15px] tap transition-colors hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.14em] font-semibold text-white/35">
          A scorebook for the rest of us
        </p>
      </div>
    </div>
  )
}
