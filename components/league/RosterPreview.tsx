'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { DraftRoster, DraftTeam, DraftPlayer } from '@/lib/roster-import/schema'
import { POSITIONS } from '@/lib/roster-import/schema'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#1e3a5f', '#1c1c1e', '#6b7280', '#ffffff',
]

interface Props {
  draft: DraftRoster
  onChange: (draft: DraftRoster) => void
}

export function RosterPreview({ draft, onChange }: Props) {
  function updateTeam(teamCid: string, patch: Partial<Omit<DraftTeam, '_cid' | 'players'>>) {
    onChange({
      teams: draft.teams.map((t) =>
        t._cid === teamCid ? { ...t, ...patch } : t
      ),
    })
  }

  function updatePlayer(teamCid: string, playerCid: string, patch: Partial<Omit<DraftPlayer, '_cid'>>) {
    onChange({
      teams: draft.teams.map((t) =>
        t._cid === teamCid
          ? { ...t, players: t.players.map((p) => p._cid === playerCid ? { ...p, ...patch } : p) }
          : t
      ),
    })
  }

  function removePlayer(teamCid: string, playerCid: string) {
    onChange({
      teams: draft.teams.map((t) =>
        t._cid === teamCid
          ? { ...t, players: t.players.filter((p) => p._cid !== playerCid) }
          : t
      ),
    })
  }

  function addPlayer(teamCid: string) {
    onChange({
      teams: draft.teams.map((t) =>
        t._cid === teamCid
          ? { ...t, players: [...t.players, { _cid: crypto.randomUUID(), name: '', number: null, position: null }] }
          : t
      ),
    })
  }

  return (
    <div className="space-y-4">
      {draft.teams.map((team) => {
        const color = team.color_hex ?? PRESET_COLORS[5]
        return (
          <div key={team._cid} className="rounded-lg border border-border overflow-hidden">
            {/* Team header */}
            <div className="p-3 bg-muted/40 space-y-2">
              <Input
                value={team.name}
                onChange={(e) => updateTeam(team._cid, { name: e.target.value })}
                placeholder="Team name"
                className="text-base font-semibold tracking-tight"
              />
              {/* Color picker */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border shrink-0"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6b7280' }}
                />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateTeam(team._cid, { color_hex: c })}
                      className="w-5 h-5 rounded border transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? 'hsl(var(--primary))' : 'transparent',
                        outline: color === c ? '2px solid hsl(var(--primary))' : 'none',
                        outlineOffset: '1px',
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Player rows */}
            <div className="divide-y divide-border">
              {team.players.map((player) => (
                <div key={player._cid} className="flex items-center gap-2 px-3 py-2">
                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(team._cid, player._cid, { name: e.target.value })}
                    placeholder="Player name"
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    value={player.number ?? ''}
                    onChange={(e) => updatePlayer(team._cid, player._cid, { number: e.target.value || null })}
                    placeholder="#"
                    maxLength={2}
                    className="w-12 h-8 text-sm text-center font-mono"
                  />
                  <select
                    value={player.position ?? ''}
                    onChange={(e) => updatePlayer(team._cid, player._cid, { position: (e.target.value || null) as DraftPlayer['position'] })}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">—</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removePlayer(team._cid, player._cid)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${player.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add player */}
            <div className="px-3 py-2 border-t border-border">
              <button
                type="button"
                onClick={() => addPlayer(team._cid)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add player
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
