import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leagues } = user
    ? await supabase
        .from('leagues')
        .select(`*, teams (id)`)
        .eq('commissioner_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
              Your Leagues
            </p>
            <h1 className="font-display text-5xl font-800 tracking-tight uppercase mt-0.5 leading-none">
              Leagues<span className="text-stitch">.</span>
            </h1>
          </div>
          <Link
            href="/leagues/new"
            className="shrink-0 inline-flex items-center h-9 px-3 rounded-md bg-primary text-primary-foreground font-display font-700 text-xs tracking-[0.18em] uppercase hover:bg-foreground/85 transition"
          >
            + New
          </Link>
        </div>
        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />
      </header>

      <div className="px-4 pb-6">
        {!leagues?.length ? (
          <div className="relative rounded-md border border-border bg-card overflow-hidden mt-4">
            <div aria-hidden="true" className="stitch-rule opacity-80" />
            <div className="p-8 text-center space-y-3">
              <span className="inline-block pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.28em] uppercase font-800 px-3 py-1.5 pr-6">
                First Pitch
              </span>
              <h2 className="font-display text-2xl font-800 tracking-tight uppercase leading-tight">
                No leagues yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Create your first league — invite teams with a 6-character code.
              </p>
              <Link
                href="/leagues/new"
                className="inline-flex items-center justify-center h-11 px-6 mt-2 rounded-md bg-stitch text-stitch-foreground font-display font-700 text-sm tracking-[0.22em] uppercase hover:bg-stitch/90 transition"
              >
                Start a League
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {leagues.map((league, idx) => {
              const teamCount = (league.teams as { id: string }[]).length
              return (
                <li key={league.id}>
                  <Link
                    href={`/leagues/${league.id}`}
                    className="group relative flex items-center gap-4 p-4 rounded-md bg-card border border-border hover:border-foreground/30 hover:-translate-y-[1px] transition-all"
                  >
                    {/* Index number — scorebook page ref */}
                    <span className="font-mono tabular-nums text-xs text-muted-foreground w-6 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg font-800 tracking-[0.04em] uppercase truncate group-hover:text-stitch transition-colors">
                        {league.name}
                      </p>
                      <p className="font-display text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-600 mt-0.5">
                        {league.season}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono tabular-nums text-xl font-700">{teamCount}</p>
                      <p className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-700">
                        {teamCount === 1 ? 'Team' : 'Teams'}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
