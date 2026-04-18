import { createClient } from '@/lib/supabase/server'
import { BattingStatsTable } from '@/components/stats/BattingStatsTable'
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StatsPage() {
  const supabase = await createClient()
  // Show stats from the most recent league
  const { data: recentLeagues } = await supabase
    .from('leagues')
    .select('id, name, season')
    .order('created_at', { ascending: false })
    .limit(1)

  const leagueId = recentLeagues?.[0]?.id

  const [{ data: batting }, { data: pitching }] = leagueId
    ? await Promise.all([
        supabase.from('batting_stats').select('*').eq('league_id', leagueId).gt('ab', 0).order('ba', { ascending: false }),
        supabase.from('pitching_stats').select('*').eq('league_id', leagueId).gt('outs_recorded', 0).order('era', { ascending: true }),
      ])
    : [{ data: null }, { data: null }]

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-6 pb-4">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-700">
          League Leaders
        </p>
        <h1 className="font-display text-5xl font-800 tracking-tight uppercase mt-0.5 leading-none">
          Stats<span className="text-stitch">.</span>
        </h1>
        {recentLeagues?.[0] && (
          <p className="font-display text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-700 mt-2">
            {recentLeagues[0].name} · {recentLeagues[0].season}
          </p>
        )}
        <div aria-hidden="true" className="stitch-rule mt-4 opacity-85" />
      </header>

      <div className="px-4 pb-6">
        {!leagueId ? (
          <div className="relative rounded-md border border-border bg-card overflow-hidden mt-2">
            <div aria-hidden="true" className="stitch-rule opacity-80" />
            <div className="p-8 text-center space-y-3">
              <span className="inline-block pennant-badge bg-pennant text-pennant-foreground font-display text-[10px] tracking-[0.28em] uppercase font-800 px-3 py-1.5 pr-6">
                Warmups
              </span>
              <h2 className="font-display text-2xl font-800 tracking-tight uppercase leading-tight">
                No stats yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Create a league and play some games to fill the back of the card.
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="batting">
            <TabsList className="w-full">
              <TabsTrigger
                value="batting"
                className="flex-1 font-display text-[11px] tracking-[0.22em] uppercase font-700"
              >
                Batting
              </TabsTrigger>
              <TabsTrigger
                value="pitching"
                className="flex-1 font-display text-[11px] tracking-[0.22em] uppercase font-700"
              >
                Pitching
              </TabsTrigger>
            </TabsList>
            <TabsContent value="batting" className="mt-4">
              <BattingStatsTable stats={batting ?? []} />
            </TabsContent>
            <TabsContent value="pitching" className="mt-4">
              <PitchingStatsTable stats={pitching ?? []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
