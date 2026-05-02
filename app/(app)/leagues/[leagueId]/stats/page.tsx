import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
    <div className="min-h-screen">
      <header className="px-5 pt-5 pb-4">
        <Link
          href={`/leagues/${leagueId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          {league.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Stats</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{league.season}</p>
      </header>

      <div className="px-4 pb-6">
        <Tabs defaultValue="batting">
          <TabsList className="w-full">
            <TabsTrigger value="batting" className="flex-1 text-sm font-medium">Batting</TabsTrigger>
            <TabsTrigger value="pitching" className="flex-1 text-sm font-medium">Pitching</TabsTrigger>
          </TabsList>
          <TabsContent value="batting" className="mt-4">
            <BattingStatsTable stats={batting ?? []} />
          </TabsContent>
          <TabsContent value="pitching" className="mt-4">
            <PitchingStatsTable stats={pitching ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
