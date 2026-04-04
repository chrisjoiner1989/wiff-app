import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BattingStatsTable } from '@/components/stats/BattingStatsTable'
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  params: Promise<{ leagueId: string }>
}

export default async function LeagueStatsPage({ params }: Props) {
  const { leagueId } = await params
  const supabase = await createClient()

  const [{ data: batting }, { data: pitching }, { data: league }] = await Promise.all([
    supabase
      .from('batting_stats')
      .select('*')
      .eq('league_id', leagueId)
      .gt('ab', 0)
      .order('ba', { ascending: false }),
    supabase
      .from('pitching_stats')
      .select('*')
      .eq('league_id', leagueId)
      .gt('outs_recorded', 0)
      .order('era', { ascending: true }),
    supabase.from('leagues').select('name, season').eq('id', leagueId).single(),
  ])

  if (!league) notFound()

  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="font-display text-3xl font-800 tracking-tight">{league.name}</h1>
        <p className="text-muted-foreground text-sm">{league.season} — Statistics</p>
      </header>

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
    </div>
  )
}
