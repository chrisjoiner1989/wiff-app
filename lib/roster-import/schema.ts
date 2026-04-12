import { z } from 'zod'

export const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Utility'] as const

export const ParsedPlayerSchema = z.object({
  name: z.string().min(1),
  number: z.string().nullable().optional(),
  position: z.enum(POSITIONS).nullable().optional(),
})

export const ParsedTeamSchema = z.object({
  name: z.string().min(1),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  players: z.array(ParsedPlayerSchema),
})

export const ParsedRosterSchema = z.object({
  teams: z.array(ParsedTeamSchema),
})

export type ParsedPlayer = z.infer<typeof ParsedPlayerSchema>
export type ParsedTeam = z.infer<typeof ParsedTeamSchema>
export type ParsedRoster = z.infer<typeof ParsedRosterSchema>

// Drafts add a stable client-side ID for React keys
export interface DraftPlayer extends ParsedPlayer {
  _cid: string
}
export interface DraftTeam extends Omit<ParsedTeam, 'players'> {
  _cid: string
  players: DraftPlayer[]
}
export interface DraftRoster {
  teams: DraftTeam[]
}

export type RosterImportResponse =
  | { ok: true; data: ParsedRoster }
  | { ok: false; error: string }

export function toDraft(parsed: ParsedRoster): DraftRoster {
  return {
    teams: parsed.teams.map((team) => ({
      ...team,
      _cid: crypto.randomUUID(),
      players: team.players.map((player) => ({
        ...player,
        _cid: crypto.randomUUID(),
      })),
    })),
  }
}
