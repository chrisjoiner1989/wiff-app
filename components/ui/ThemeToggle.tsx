'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const active = mounted ? theme ?? 'system' : 'system'

  return (
    <div
      className="inline-flex items-center rounded-full bg-muted p-0.5"
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = active === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center h-7 w-9 rounded-full text-[11px] font-semibold tap transition-colors',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={label}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
