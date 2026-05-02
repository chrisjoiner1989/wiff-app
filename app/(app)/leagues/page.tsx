import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'

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
      <header className="px-4 pt-7 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Commissioner</p>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-none">
              Leagues
            </h1>
          </div>
          <Link
            href="/leagues/new"
            className="shrink-0 inline-flex items-center gap-1 h-8 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold tap hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New
          </Link>
        </div>
      </header>

      <div className="pb-8">
        {!leagues?.length ? (
          <div className="border-y border-border px-6 py-14 text-center space-y-3">
            <p className="eyebrow">Nothing here yet</p>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">
              Start your first league
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Create a league, invite teams with a 6-character code.
            </p>
            <div className="pt-2">
              <Link
                href="/leagues/new"
                className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
              >
                Create league
              </Link>
            </div>
          </div>
        ) : (
          <ul className="px-4 divide-y divide-border border-y border-border">
            {leagues.map((league) => {
              const teamCount = (league.teams as { id: string }[]).length
              return (
                <li key={league.id}>
                  <Link
                    href={`/leagues/${league.id}`}
                    className="group flex items-center gap-3 py-4 -mx-4 px-4 row-hover tap"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate leading-tight">
                        {league.name}
                      </p>
                      <p className="eyebrow mt-1.5">
                        {league.season} · {teamCount} {teamCount === 1 ? 'team' : 'teams'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
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
