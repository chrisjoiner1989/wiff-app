import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ParsedRosterSchema, POSITIONS, type RosterImportResponse } from '@/lib/roster-import/schema'

const RATE_LIMIT = 5      // max requests
const WINDOW_HOURS = 1    // per hour

const anthropic = new Anthropic()

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_roster',
  description: 'Extract structured team and player data from the provided roster content.',
  input_schema: {
    type: 'object' as const,
    properties: {
      teams: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Team name' },
            color_hex: {
              type: 'string',
              description: 'Hex color like #ef4444 if explicitly mentioned, otherwise omit',
            },
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Player full name' },
                  number: {
                    type: 'string',
                    description: 'Jersey number as string (e.g. "7"), omit if not present',
                  },
                  position: {
                    type: 'string',
                    enum: POSITIONS as unknown as string[],
                    description: 'Position abbreviation, omit if unclear',
                  },
                },
                required: ['name'],
              },
            },
          },
          required: ['name', 'players'],
        },
      },
    },
    required: ['teams'],
  },
}

const SYSTEM_PROMPT = `You are a sports data assistant. Extract team and player information from the provided content.

The content may be pasted text from a document or spreadsheet, OCR output from a handwritten roster (may have spelling errors, inconsistent formatting), or a photo of a paper roster.

Rules:
- Group players under their team. If no explicit team names appear, group all players under a single team called "Team 1".
- Player numbers: extract digits only (e.g. "#7" → "7"). Omit if not present.
- Positions: map common abbreviations and full names to the allowed enum values (P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH, Utility). If unclear, omit.
- Names: clean up obvious OCR artifacts but preserve unusual names.
- color_hex: only include if a color is explicitly mentioned by name or hex.

Always call the extract_roster tool with your findings.`

export async function POST(req: NextRequest): Promise<NextResponse<RosterImportResponse>> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: max 5 requests per user per hour
  const service = createServiceClient()
  const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const { count } = await service
    .from('roster_import_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json(
      { ok: false, error: `Rate limit reached — max ${RATE_LIMIT} imports per hour` },
      { status: 429 }
    )
  }

  try {
    const formData = await req.formData()
    const inputType = formData.get('type') as 'text' | 'image'

    let messageContent: Anthropic.MessageParam['content']

    if (inputType === 'text') {
      const text = formData.get('text') as string
      if (!text?.trim()) {
        return NextResponse.json({ ok: false, error: 'No text provided' }, { status: 400 })
      }
      if (text.length > 50_000) {
        return NextResponse.json({ ok: false, error: 'Text too long (max 50,000 characters)' }, { status: 400 })
      }
      messageContent = [{ type: 'text', text: `Parse this roster:\n\n${text}` }]
    } else {
      const base64 = formData.get('base64') as string
      const mimeType = (formData.get('mimeType') as string) || 'image/jpeg'
      if (!base64) {
        return NextResponse.json({ ok: false, error: 'No image provided' }, { status: 400 })
      }
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
      const safeMime = validMimeTypes.includes(mimeType as typeof validMimeTypes[number])
        ? (mimeType as typeof validMimeTypes[number])
        : 'image/jpeg'
      messageContent = [
        { type: 'text', text: 'Parse this roster image:' },
        {
          type: 'image',
          source: { type: 'base64', media_type: safeMime, data: base64 },
        },
      ]
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_roster' },
      messages: [{ role: 'user', content: messageContent }],
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ ok: false, error: 'AI did not return structured data' }, { status: 500 })
    }

    const parsed = ParsedRosterSchema.safeParse(toolUse.input)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid data shape from AI' }, { status: 500 })
    }

    // Record successful use for rate limiting
    await service.from('roster_import_log').insert({ user_id: user.id })

    return NextResponse.json({ ok: true, data: parsed.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[roster-import]', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
