import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/league/GameCard'
import Link from 'next/link'
import { Plus, ArrowUpRight, Trophy, CircleDot, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const gameSelect = `
    *,
    home_team:teams!games_home_team_id_fkey (id, name, color_hex, logo_url),
    away_team:teams!games_away_team_id_fkey (id, name, color_hex, logo_url),
    league:leagues!inner (id, name, commissioner_id)
  `

  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  const [
    { data: profile },
    { data: liveGames },
    { data: upcomingGames },
    { count: leagueCount },
    { count: teamCount },
  ] = user
    ? await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase
          .from('games')
          .select(gameSelect)
          .eq('status', 'live')
          .eq('league.commissioner_id', user.id)
          .limit(5),
        supabase
          .from('games')
          .select(gameSelect)
          .eq('status', 'scheduled')
          .eq('league.commissioner_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5),
        supabase
          .from('leagues')
          .select('id', { count: 'exact', head: true })
          .eq('commissioner_id', user.id),
        supabase
          .from('teams')
          .select('id, league:leagues!inner (commissioner_id)', { count: 'exact', head: true })
          .eq('league.commissioner_id', user.id),
      ])
    : [
        { data: null },
        { data: [] },
        { data: [] },
        { count: 0 },
        { count: 0 },
      ]

  const liveCount = liveGames?.length ?? 0
  const upcomingCount = upcomingGames?.length ?? 0
  const hasGames = liveCount > 0 || upcomingCount > 0

  const firstName =
    profile?.full_name?.split(' ')[0] ??
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0]

  const greeting = greetingForHour(new Date().getHours())

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // One-line summary that gives the day a pulse
  const summary = liveCount > 0
    ? `${liveCount} ${liveCount === 1 ? 'game' : 'games'} live now`
    : upcomingCount > 0
      ? `Next up: ${upcomingCount} on the schedule`
      : (leagueCount ?? 0) > 0
        ? 'No games today — quiet on the field'
        : 'Welcome — let’s build your league'

  return (
    <div className="min-h-screen">
      {/* Welcome */}
      <header className="px-4 pt-7 pb-6">
        <p className="eyebrow">{today}</p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] mt-1.5 leading-[1.05]">
          {greeting}
          {firstName && (
            <>
              ,<br />
              <span className="text-foreground">{firstName}</span>
              <span className="text-destructive">.</span>
            </>
          )}
          {!firstName && <span className="text-destructive">.</span>}
        </h1>
        <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
          {summary}
        </p>

        <div className="flex gap-1.5 mt-5">
          <Link
            href="/leagues/new"
            className="inline-flex items-center gap-1 h-8 pl-3 pr-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold tap hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New league
          </Link>
          {(leagueCount ?? 0) > 0 && (
            <Link
              href="/games/new"
              className="inline-flex items-center gap-1 h-8 px-3.5 rounded-full bg-muted text-foreground text-[13px] font-semibold tap hover:bg-muted/70 transition-colors"
            >
              Schedule game
            </Link>
          )}
        </div>
      </header>

      {/* Glance bar — quick personal stats */}
      {(leagueCount ?? 0) > 0 && (
        <ul className="grid grid-cols-3 divide-x divide-border border-y border-border">
          <GlanceTile
            value={leagueCount ?? 0}
            label={leagueCount === 1 ? 'League' : 'Leagues'}
            href="/leagues"
            icon={Trophy}
          />
          <GlanceTile
            value={teamCount ?? 0}
            label={teamCount === 1 ? 'Team' : 'Teams'}
            href="/leagues"
            icon={Users}
          />
          <GlanceTile
            value={liveCount + upcomingCount}
            label="Up next"
            href="/games"
            icon={CircleDot}
            accent={liveCount > 0}
          />
        </ul>
      )}

      {hasGames ? (
        <div className="pt-8 pb-8">
          {liveCount > 0 && (
            <Section label="Live" count={liveCount} live>
              <ul className="divide-y divide-border">
                {liveGames!.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game as any} showLiveBadge />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {upcomingCount > 0 && (
            <Section label="Upcoming" count={upcomingCount}>
              <ul className="divide-y divide-border">
                {upcomingGames!.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game as any} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section label="Jump to">
            <div className="px-4 grid grid-cols-2 gap-2">
              <QuickTile href="/leagues" label="Leagues" sub="Browse all" />
              <QuickTile href="/games" label="Schedule" sub="Full calendar" />
            </div>
          </Section>
        </div>
      ) : (
        <div className="pt-8 pb-10 space-y-8">
          {(leagueCount ?? 0) === 0 ? (
            <EmptyHero />
          ) : (
            <div className="border-y border-border px-6 py-12 text-center space-y-3">
              <p className="eyebrow">Quiet day</p>
              <h2 className="text-2xl font-bold tracking-[-0.025em]">
                Nothing on the schedule.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Schedule a game and it shows up here.
              </p>
              <div className="pt-2">
                <Link
                  href="/games/new"
                  className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
                >
                  Schedule a game
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function greetingForHour(h: number) {
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function EmptyHero() {
  return (
    <>
      <div className="border-y border-border px-6 py-14 text-center space-y-4">
        <p className="eyebrow">Welcome aboard</p>
        <h2 className="text-2xl font-bold tracking-[-0.025em] leading-tight">
          Let&rsquo;s build your league.
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Start a league, add teams, paste a roster.
          The box score writes itself.
        </p>
        <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
          <Link
            href="/leagues/new"
            className="inline-flex items-center justify-center h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm tap hover:bg-primary/90 transition-colors"
          >
            Create your first league
          </Link>
          <Link
            href="/leagues"
            className="inline-flex items-center justify-center h-10 rounded-full text-foreground font-semibold text-sm tap hover:bg-muted transition-colors"
          >
            Browse existing
          </Link>
        </div>
      </div>

      <ol className="px-4 space-y-1">
        <p className="eyebrow mb-2 px-1">3 steps to live scoring</p>
        {[
          { n: '01', label: 'Create a league', sub: 'Name it. Set the season.' },
          { n: '02', label: 'Add teams', sub: 'Paste a roster — we’ll parse it.' },
          { n: '03', label: 'Schedule a game', sub: 'Open scorekeeper. Play ball.' },
        ].map((s) => (
          <li
            key={s.n}
            className="flex items-start gap-4 py-3 border-b border-border last:border-0"
          >
            <span className="scoreboard text-base text-muted-foreground shrink-0 mt-0.5">
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">
                {s.label}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {s.sub}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

function Section({
  label,
  count,
  live,
  children,
}: {
  label: string
  count?: number
  live?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="eyebrow">{label}</h2>
          {live && (
            <span
              className="block w-1.5 h-1.5 rounded-full bg-destructive"
              aria-hidden="true"
            />
          )}
        </div>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground tabular-nums font-semibold">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="px-4 border-y border-border">
        {children}
      </div>
    </section>
  )
}

function GlanceTile({
  value,
  label,
  href,
  icon: Icon,
  accent,
}: {
  value: number
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  accent?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-col items-center justify-center gap-1.5 py-5 row-hover tap"
      >
        <div className="flex items-center gap-1.5">
          <Icon
            className={
              accent
                ? 'h-3.5 w-3.5 text-destructive'
                : 'h-3.5 w-3.5 text-muted-foreground'
            }
            strokeWidth={2.25}
          />
          <span
            className={
              accent
                ? 'scoreboard text-2xl text-destructive leading-none'
                : 'scoreboard text-2xl leading-none'
            }
          >
            {value}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
      </Link>
    </li>
  )
}

function QuickTile({
  href,
  label,
  sub,
}: {
  href: string
  label: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 rounded-md bg-card border border-border tap hover:border-foreground/30 transition-colors"
    >
      <div>
        <span className="block text-[15px] font-semibold leading-tight">{label}</span>
        <span className="block text-[11px] text-muted-foreground mt-0.5">{sub}</span>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  )
}
