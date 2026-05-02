import { createClient } from '@/lib/supabase/server'
import { BattingStatsTable } from '@/components/stats/BattingStatsTable'
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StatsPage() {
  const supabase = await createClient()
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
      <header className="px-4 pt-7 pb-5">
        <p className="eyebrow">League leaders</p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-none">
          Stats
        </h1>
        {recentLeagues?.[0] && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mt-2.5">
            {recentLeagues[0].name} · {recentLeagues[0].season}
          </p>
        )}
      </header>

      <div className="pb-8">
        {!leagueId ? (
          <div className="border-y border-border px-6 py-14 text-center space-y-3">
            <p className="eyebrow">No data</p>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">
              Stats fill in automatically
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Create a league and play some games — leaderboards build themselves.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="batting" className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="batting" className="flex-1 text-sm font-semibold">
                Batting
              </TabsTrigger>
              <TabsTrigger value="pitching" className="flex-1 text-sm font-semibold">
                Pitching
              </TabsTrigger>
            </TabsList>
            <TabsContent value="batting" className="mt-4 -mx-4">
              <BattingStatsTable stats={batting ?? []} />
            </TabsContent>
            <TabsContent value="pitching" className="mt-4 -mx-4">
              <PitchingStatsTable stats={pitching ?? []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
