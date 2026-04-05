# Wiff — Wiffle Ball League Manager

A full-featured mobile-first Progressive Web App for running wiffle ball leagues. Wiff handles everything from league creation and team management to live pitch-by-pitch scorekeeping and automated season statistics.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Rules Engine](#rules-engine)
- [Game Scoring](#game-scoring)
- [Statistics](#statistics)
- [Authentication & Authorization](#authentication--authorization)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Deployment](#deployment)

---

## Overview

Wiff is built for recreational wiffle ball leagues. A **commissioner** creates a league, configures its rules (innings, mercy rule, pitching distance, strike zone type, etc.), adds teams, and schedules games. Players join via a 6-character invite code. During games, the commissioner runs a live scorekeeper UI that tracks every at-bat, advances baserunners automatically (including ghost runner logic), and persists the full play-by-play to the database. Stats — batting average, OBP, SLG, ERA, WHIP, K/9 — are computed in real time via Postgres views.

---

## Features

### League Management
- Create leagues with fully configurable rules
- Edit league name, season label, and all rule settings at any time
- Delete a league (cascades to all teams, games, and stats)
- Auto-generated 6-character join code for player invitations
- Commissioner-gated actions — only the league creator can manage

### Team Management
- Add unlimited teams to a league with a custom name and team color
- Color picker with preset swatches plus a manual hex input
- Team detail page with roster and batting/pitching stat summaries
- Edit roster: add and remove players with jersey number and position

### Player Profiles
- Players link to Supabase auth users (optional — guest players are supported)
- Per-player batting and pitching stat pages
- Jersey number and position tracking

### Game Scheduling & Scorekeeping
- Schedule games between any two teams in a league
- Live scorekeeper UI with:
  - At-bat result buttons (1B, 2B, 3B, HR, OUT, K, WALK, FOUL OUT)
  - Automatic baserunner advancement with ghost runner support
  - Inning-by-inning linescore
  - Visual baserunner diamond
  - Undo last action
  - Mercy rule detection and automatic game-over logic
  - Walk-off win detection
- Live spectator view (read-only, real-time)
- Game status progression: `scheduled → live → final`

### Statistics
- **Batting:** G, AB, H, 1B, 2B, 3B, HR, RBI, BB, K, HBP, BA, OBP, SLG
- **Pitching:** G, Outs Recorded, IP, H, R, ER, BB, K, ERA, WHIP, K/9
- **Standings:** W, L, G, PCT, Runs Scored, Runs Allowed, Run Differential
- All stats computed via Postgres views — no manual sync required
- League-wide stats page and per-player drill-down

### Auth & Onboarding
- Magic link / OTP email authentication via Supabase Auth
- Onboarding flow captures full name and username on first sign-in
- Auto-created profile row on signup via Postgres trigger

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 (strict) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 + Immer |
| Backend / DB | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| PWA | next-pwa |
| Toasts | Sonner |
| Deployment | Vercel |

---

## Project Structure

```
wiff-app/
├── app/
│   ├── (auth)/                   # Auth routes (no bottom nav)
│   │   ├── login/                # OTP email login
│   │   ├── onboarding/           # First-time profile setup
│   │   └── callback/             # Supabase auth callback handler
│   ├── (app)/                    # Protected app routes (with bottom nav)
│   │   ├── page.tsx              # Home dashboard
│   │   ├── leagues/
│   │   │   ├── page.tsx          # League list
│   │   │   ├── new/              # Create league
│   │   │   └── [leagueId]/
│   │   │       ├── page.tsx      # League detail (standings, teams, games)
│   │   │       ├── edit/         # Edit league settings + delete
│   │   │       ├── teams/new/    # Add team to league
│   │   │       ├── schedule/     # Full game schedule
│   │   │       └── stats/        # League-wide batting & pitching stats
│   │   ├── teams/
│   │   │   └── [teamId]/
│   │   │       ├── page.tsx      # Team detail + roster + stats
│   │   │       └── edit/         # Edit roster (add/remove players)
│   │   ├── games/
│   │   │   ├── page.tsx          # Upcoming & recent games
│   │   │   ├── new/              # Schedule a game
│   │   │   └── [gameId]/
│   │   │       ├── page.tsx      # Game summary
│   │   │       ├── lineup/       # Set batting order before game
│   │   │       ├── score/        # Live scorekeeper (commissioner only)
│   │   │       └── live/         # Live spectator view
│   │   ├── players/[playerId]/   # Player profile + career stats
│   │   ├── stats/                # Global stats leaderboard
│   │   └── profile/              # User profile & settings
│   ├── layout.tsx                # Root layout + theme provider
│   ├── providers.tsx             # TanStack Query + theme providers
│   └── globals.css               # Tailwind base + CSS variables
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # BottomNav, shell components
│   ├── league/                   # StandingsTable, GameCard
│   └── scoring/                  # Linescore, BaserunnerDiamond
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server-side Supabase client (cookies)
│   │   └── middleware.ts         # Session refresh helper
│   ├── queries/
│   │   ├── leagues.ts            # useLeagues, useLeague, useCreateLeague,
│   │   │                         #   useUpdateLeague, useDeleteLeague
│   │   ├── teams.ts              # useTeam, useTeamRoster, useCreateTeam,
│   │   │                         #   useAddPlayer, useUpdatePlayer, useDeletePlayer
│   │   └── games.ts              # Game queries and mutations
│   ├── stores/
│   │   └── gameScoringStore.ts   # Zustand store for live scoring state
│   └── wiffle/
│       └── rulesEngine.ts        # Pure functions: runner advancement,
│                                 #   mercy rule, game-over detection
│
├── types/
│   └── database.types.ts         # All DB row types, enums, WiffleRulesConfig
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql   # All tables + indexes
        ├── 002_rls_policies.sql     # Row Level Security policies
        ├── 003_stats_views.sql      # batting_stats, pitching_stats, standings views
        └── 004_profiles.sql         # profiles table + auto-create trigger
```

---

## Database Schema

### Tables

**`leagues`** — A league run by a commissioner.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| name | text | League display name |
| season | text | e.g. "2025 Summer Season" |
| commissioner_id | uuid | FK → `auth.users` |
| rules_config | jsonb | Full `WiffleRulesConfig` object |
| join_code | text | Unique 6-char invite code, auto-generated |
| created_at | timestamptz | |

**`teams`** — A team within a league.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| league_id | uuid | FK → `leagues` (cascade delete) |
| name | text | |
| logo_url | text | Optional |
| color_hex | text | Hex color, default `#1e3a5f` |

**`players`** — A player on a team roster.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | FK → `teams` (cascade delete) |
| user_id | uuid | FK → `auth.users` (nullable — guest players) |
| name | text | Display name |
| number | text | Jersey number |
| position | text | e.g. "P", "1B", "CF" |

**`games`** — A scheduled or completed game.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| league_id | uuid | FK → `leagues` |
| home_team_id / away_team_id | uuid | FK → `teams` |
| scheduled_at | timestamptz | |
| status | `game_status` | `scheduled`, `live`, `final`, `postponed` |
| current_inning | int | Live scoring state |
| current_half | text | `top` or `bottom` |
| outs | int | 0–3 |
| home_score / away_score | int | Running totals |
| runner_first/second/third | uuid | FK → `players` (ghost runner state) |

**`game_lineups`** — Batting order for each team in a game.

**`at_bats`** — Every plate appearance with its result and RBI count.

**`pitches`** — Individual pitches within an at-bat (ball, strike, foul, hit, HBP).

**`game_innings`** — Per-inning run/hit/error linescore.

### Views

- **`batting_stats`** — Aggregated batting stats per player (BA, OBP, SLG, etc.)
- **`pitching_stats`** — Aggregated pitching stats per player (ERA, WHIP, K/9, etc.)
- **`standings`** — Win/loss records with PCT and run differential per team

---

## Rules Engine

The rules engine lives in [`lib/wiffle/rulesEngine.ts`](lib/wiffle/rulesEngine.ts) and is composed of pure functions — no side effects, fully testable in isolation.

### `WiffleRulesConfig` (configurable per league)

| Setting | Default | Description |
|---|---|---|
| `innings` | 9 | Number of innings |
| `ghost_runners` | true | Runners advance automatically without a physical player on base |
| `courtesy_runners_allowed` | true | Allow courtesy runners |
| `strike_zone_type` | `mat` | `mat` (physical mat), `ump` (live umpire), `honor` |
| `foul_ball_outs` | true | Foul balls count toward outs |
| `foul_balls_for_out` | 3 | How many fouls before an out is recorded |
| `max_runs_per_inning` | null | Optional cap on runs per inning |
| `mercy_rule_runs` | 10 | Run differential required to trigger mercy rule |
| `mercy_rule_after_inning` | 5 | Earliest inning the mercy rule can apply |
| `pitching_distance_ft` | 45 | Distance from pitching rubber to home plate |
| `no_leading_off` | true | Baserunners may not lead off |
| `no_stealing` | true | Stealing bases is not allowed |
| `one_pitch_rule` | false | Each at-bat ends after one pitch |

### Key Functions

- **`advanceRunners(result, runners, batterId, rules)`** — Given an at-bat result and current baserunner state, returns the new runner positions and the number of runs scored. Handles ghost runner advancement (e.g. a runner on second scores on a single).
- **`checkMercyRule(leadingScore, trailingScore, inning, rules)`** — Returns `true` if the mercy rule differential has been reached after the required inning.
- **`isGameOver(homeScore, awayScore, inning, half, rules)`** — Detects normal game completion, walk-off wins, and mercy rule endings.
- **`isHit(result)` / `isOut(result)`** — Simple result classification helpers used throughout the scoring flow.

---

## Game Scoring

The live scorekeeper (`ScorekeeperClient`) is a client component backed by a Zustand store (`gameScoringStore`).

### Flow

1. Commissioner navigates to `/games/[gameId]/score`
2. The server fetches the game, lineups, and inning data and passes them as props to `ScorekeeperClient`
3. The Zustand store is initialized from server state via `store.initGame(game)`
4. For each at-bat, the commissioner taps a result button (1B, 2B, HR, OUT, K, etc.)
5. `advanceRunners()` computes the new baserunner state and runs scored
6. The result is persisted to Supabase: an `at_bats` row is inserted, the `games` row is updated (score, inning, outs, runner positions), and `game_innings` is upserted for the linescore
7. The store reflects the new state; the UI re-renders immediately
8. Undo reverts the last action from the `actionHistory` stack
9. When `isGameOver()` returns `true`, the game status is set to `final`

### Zustand Store Shape

```typescript
{
  gameId: string | null
  inning: number
  half: 'top' | 'bottom'
  outs: number               // 0–3
  homeScore: number
  awayScore: number
  runners: {
    first: string | null     // player id or null
    second: string | null
    third: string | null
  }
  currentBatterIndex: { home: number; away: number }
  actionHistory: ScoringAction[]
}
```

---

## Statistics

All statistics are computed by Postgres views and queried directly from Supabase — there is no background job or denormalized stats table to keep in sync.

- **Batting stats** are derived from the `at_bats` table grouped by `batter_id`
- **Pitching stats** are derived from the `at_bats` table grouped by `pitcher_id`
- **Standings** are derived from the `games` table filtered to `status = 'final'`

Querying `supabase.from('batting_stats')`, `supabase.from('pitching_stats')`, and `supabase.from('standings')` works identically to querying a regular table.

---

## Authentication & Authorization

Auth is handled entirely by Supabase Auth using **OTP email** (6-digit code). The `emailRedirectTo` option is intentionally omitted so the OTP code flow is always used rather than a redirect link.

On first sign-in, users are directed to `/onboarding` to set their full name and username. A Postgres trigger (`on_auth_user_created`) automatically creates a row in `public.profiles` whenever a new user signs up.

### Row Level Security

All tables have RLS enabled. Key policies:

| Table | Who can read | Who can write |
|---|---|---|
| `leagues` | Everyone | Insert: authenticated users (must be commissioner). Update/Delete: commissioner only |
| `teams` | Everyone | Commissioner of the parent league |
| `players` | Everyone | Commissioner can insert/delete; commissioner or linked user can update |
| `games`, `game_lineups`, `at_bats`, `pitches`, `game_innings` | Everyone | Commissioner of the league only |
| `profiles` | Everyone | The profile owner only |

The SQL helper function `is_league_commissioner(league_id uuid)` is used across all team/game policies to avoid repeating the commissioner check.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Installation

```bash
git clone https://github.com/chrisjoiner1989/wiff-app.git
cd wiff-app
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find your URL and anon key in your Supabase project under **Settings → API**.

### Database Migrations

Link your local project to Supabase and push all migrations:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

This applies all four migrations in order:
1. `001_initial_schema.sql` — tables, enums, and indexes
2. `002_rls_policies.sql` — RLS policies and helper functions
3. `003_stats_views.sql` — batting, pitching, and standings views
4. `004_profiles.sql` — profiles table and auto-create trigger

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any email address — you will receive a 6-digit OTP code.

---

## Deployment

The app is deployed on [Vercel](https://vercel.com). Pushing to `main` triggers an automatic production deployment.

Required environment variables in the Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://wiff.app`).
