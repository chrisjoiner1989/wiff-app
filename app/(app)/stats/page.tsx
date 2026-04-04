import { createClient } from '@/lib/supabase/server'
import { BattingStatsTable } from '@/components/stats/BattingStatsTable'
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get leagues the user is commissioner of
  const { data: myLeagues } = await supabase
    .from('leagues')
    .select('id, name, season')
    .eq('commissioner_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const leagueId = myLeagues?.[0]?.id

  const [{ data: batting }, { data: pitching }] = leagueId
    ? await Promise.all([
        supabase.from('batting_stats').select('*').eq('league_id', leagueId).gt('ab', 0).order('ba', { ascending: false }),
        supabase.from('pitching_stats').select('*').eq('league_id', leagueId).gt('outs_recorded', 0).order('era', { ascending: true }),
      ])
    : [{ data: null }, { data: null }]

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-800 tracking-tight">STATS</h1>
        {myLeagues?.[0] && (
          <p className="text-muted-foreground text-sm">
            {myLeagues[0].name} · {myLeagues[0].season}
          </p>
        )}
      </header>

      {!leagueId ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-display text-xl font-700">NO STATS YET</p>
          <p className="text-sm mt-1">Create a league and play some games to see stats here.</p>
        </div>
      ) : (
        <Tabs defaultValue="batting">
          <TabsList className="w-full">
            <TabsTrigger value="batting" className="flex-1">Batting</TabsTrigger>
            <TabsTrigger value="pitching" className="flex-1">Pitching</TabsTrigger>
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
  )
}
