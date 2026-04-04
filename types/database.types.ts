export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─────────────────────────────────────────
// DOMAIN ENUMS
// ─────────────────────────────────────────
export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed'
export type AtBatResult = 'single' | 'double' | 'triple' | 'hr' | 'out' | 'walk' | 'k' | 'foul_out' | 'hbp' | 'fc' | 'error'
export type PitchResult = 'ball' | 'strike' | 'foul' | 'hit' | 'hbp'
export type PitchType = 'fastball' | 'curveball' | 'changeup' | 'riser' | 'drop' | 'slider' | 'knuckleball' | 'other'
export type StrikeZoneType = 'mat' | 'ump' | 'honor'

// ─────────────────────────────────────────
// RULES CONFIG
// type (not interface) so it extends Record<string, unknown>
// ─────────────────────────────────────────
export type WiffleRulesConfig = {
  innings: number
  ghost_runners: boolean
  courtesy_runners_allowed: boolean
  strike_zone_type: StrikeZoneType
  foul_ball_outs: boolean
  foul_balls_for_out: number
  max_runs_per_inning: number | null
  mercy_rule_runs: number
  mercy_rule_after_inning: number
  pitching_distance_ft: number
  no_leading_off: boolean
  no_stealing: boolean
  one_pitch_rule: boolean
}

// ─────────────────────────────────────────
// STATS ROWS
// Must be `type` (not `interface`) so they extend Record<string, unknown>
// and satisfy Supabase's GenericSchema View.Row constraint.
// ─────────────────────────────────────────
export type BattingStatsRow = {
  player_id: string
  player_name: string
  jersey_number: string | null
  team_id: string
  team_name: string
  league_id: string
  g: number
  ab: number
  h: number
  '1b': number
  '2b': number
  '3b': number
  hr: number
  rbi: number
  bb: number
  k: number
  hbp: number
  ba: number
  obp: number
  slg: number
}

export type PitchingStatsRow = {
  player_id: string
  player_name: string
  jersey_number: string | null
  team_id: string
  team_name: string
  league_id: string
  g: number
  outs_recorded: number
  ip_full: number
  ip_partial: number
  h: number
  r: number
  er: number
  bb: number
  k: number
  era: number | null
  whip: number | null
  k_per_9: number | null
}

export type StandingsRow = {
  team_id: string
  team_name: string
  league_id: string
  color_hex: string
  wins: number
  losses: number
  runs_scored: number
  runs_allowed: number
  g: number
  pct: number
  run_diff: number
}

// ─────────────────────────────────────────
// DATABASE SCHEMA
// Must satisfy Supabase's GenericSchema constraint:
//   { Tables: {...}; Views: {...}; Functions: {...} }
// Each table must have Row, Insert, Update, Relationships.
// ─────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leagues: {
        Row: {
          id: string
          name: string
          season: string
          commissioner_id: string
          rules_config: WiffleRulesConfig
          join_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          season: string
          commissioner_id: string
          rules_config?: WiffleRulesConfig
          join_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          season?: string
          commissioner_id?: string
          rules_config?: WiffleRulesConfig
          join_code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          league_id: string
          name: string
          logo_url: string | null
          color_hex: string
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          logo_url?: string | null
          color_hex?: string
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          name?: string
          logo_url?: string | null
          color_hex?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          }
        ]
      }
      players: {
        Row: {
          id: string
          team_id: string
          user_id: string | null
          name: string
          number: string | null
          position: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id?: string | null
          name: string
          number?: string | null
          position?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string | null
          name?: string
          number?: string | null
          position?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'players_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      games: {
        Row: {
          id: string
          league_id: string
          home_team_id: string
          away_team_id: string
          scheduled_at: string
          status: GameStatus
          field_location: string | null
          current_inning: number
          current_half: 'top' | 'bottom'
          outs: number
          home_score: number
          away_score: number
          runner_first: string | null
          runner_second: string | null
          runner_third: string | null
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          home_team_id: string
          away_team_id: string
          scheduled_at: string
          status?: GameStatus
          field_location?: string | null
          current_inning?: number
          current_half?: 'top' | 'bottom'
          outs?: number
          home_score?: number
          away_score?: number
          runner_first?: string | null
          runner_second?: string | null
          runner_third?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          home_team_id?: string
          away_team_id?: string
          scheduled_at?: string
          status?: GameStatus
          field_location?: string | null
          current_inning?: number
          current_half?: 'top' | 'bottom'
          outs?: number
          home_score?: number
          away_score?: number
          runner_first?: string | null
          runner_second?: string | null
          runner_third?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'games_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'games_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'games_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      game_lineups: {
        Row: {
          id: string
          game_id: string
          team_id: string
          player_id: string
          batting_order: number
          position: string | null
          is_pitcher: boolean
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          team_id: string
          player_id: string
          batting_order: number
          position?: string | null
          is_pitcher?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          team_id?: string
          player_id?: string
          batting_order?: number
          position?: string | null
          is_pitcher?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_lineups_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_lineups_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
      at_bats: {
        Row: {
          id: string
          game_id: string
          pitcher_id: string
          batter_id: string
          inning: number
          top_bottom: 'top' | 'bottom'
          result: AtBatResult | null
          rbi: number
          sequence_in_game: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          pitcher_id: string
          batter_id: string
          inning: number
          top_bottom: 'top' | 'bottom'
          result?: AtBatResult | null
          rbi?: number
          sequence_in_game: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          pitcher_id?: string
          batter_id?: string
          inning?: number
          top_bottom?: 'top' | 'bottom'
          result?: AtBatResult | null
          rbi?: number
          sequence_in_game?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'at_bats_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'at_bats_batter_id_fkey'
            columns: ['batter_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'at_bats_pitcher_id_fkey'
            columns: ['pitcher_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
      pitches: {
        Row: {
          id: string
          at_bat_id: string
          pitch_type: PitchType | null
          result: PitchResult
          sequence_number: number
          created_at: string
        }
        Insert: {
          id?: string
          at_bat_id: string
          pitch_type?: PitchType | null
          result: PitchResult
          sequence_number: number
          created_at?: string
        }
        Update: {
          id?: string
          at_bat_id?: string
          pitch_type?: PitchType | null
          result?: PitchResult
          sequence_number?: number
          created_at?: string
        }
        Relationships: []
      }
      game_innings: {
        Row: {
          id: string
          game_id: string
          inning: number
          home_runs: number
          away_runs: number
          home_hits: number
          away_hits: number
          home_errors: number
          away_errors: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          inning: number
          home_runs?: number
          away_runs?: number
          home_hits?: number
          away_hits?: number
          home_errors?: number
          away_errors?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          inning?: number
          home_runs?: number
          away_runs?: number
          home_hits?: number
          away_hits?: number
          home_errors?: number
          away_errors?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      batting_stats: {
        Row: BattingStatsRow
        Relationships: []
      }
      pitching_stats: {
        Row: PitchingStatsRow
        Relationships: []
      }
      standings: {
        Row: StandingsRow
        Relationships: []
      }
    }
    Functions: {
      is_league_commissioner: {
        Args: { league_id: string }
        Returns: boolean
      }
    }
    Enums: {
      game_status: GameStatus
      at_bat_result: AtBatResult
      pitch_result: PitchResult
      pitch_type: PitchType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─────────────────────────────────────────
// CONVENIENCE ALIASES
// ─────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
