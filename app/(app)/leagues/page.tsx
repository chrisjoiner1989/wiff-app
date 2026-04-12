import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy } from 'lucide-react'

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
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-4xl font-800 tracking-tight">LEAGUES</h1>
          <p className="text-muted-foreground text-sm">All leagues</p>
        </div>
        <Link
          href="/leagues/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          + New
        </Link>
      </header>

      {!leagues?.length ? (
        <div className="text-center py-16 space-y-3">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="font-display text-2xl font-700 tracking-wide">NO LEAGUES YET</p>
          <p className="text-muted-foreground text-sm">Create your first league to get started.</p>
          <Link
            href="/leagues/new"
            className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
          >
            Create League
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-display text-xl font-700 tracking-wide">{league.name}</p>
                <p className="text-xs text-muted-foreground">{league.season}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {(league.teams as { id: string }[]).length} team{(league.teams as { id: string }[]).length !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
