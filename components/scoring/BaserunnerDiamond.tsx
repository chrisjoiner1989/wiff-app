'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BaserunnerDiamondProps {
  first: boolean
  second: boolean
  third: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { container: 'w-14 h-14', base: 'w-3.5 h-3.5' },
  md: { container: 'w-20 h-20', base: 'w-5 h-5' },
  lg: { container: 'w-32 h-32', base: 'w-8 h-8' },
}

export function BaserunnerDiamond({
  first,
  second,
  third,
  className,
  size = 'md',
}: BaserunnerDiamondProps) {
  const { container, base } = sizes[size]

  return (
    <div
      className={cn('relative', container, className)}
      aria-label={`Runners on: ${[first && 'first', second && 'second', third && 'third'].filter(Boolean).join(', ') || 'bases empty'}`}
      role="img"
    >
      {/* Base path */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[72%] h-[72%] rotate-45 border border-foreground/15" />
      </div>

      {/* Second base — top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <Base occupied={second} baseClass={base} />
      </div>
      {/* Third base — left */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <Base occupied={third} baseClass={base} />
      </div>
      {/* First base — right */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <Base occupied={first} baseClass={base} />
      </div>
      {/* Home plate */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div
          className={cn(
            'rotate-45 border border-foreground/40 bg-card',
            base
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

function Base({
  occupied,
  baseClass,
}: {
  occupied: boolean
  baseClass: string
}) {
  return (
    <motion.div
      animate={{
        scale: occupied ? 1 : 1,
        backgroundColor: occupied ? 'var(--live)' : 'transparent',
        borderColor: occupied ? 'var(--live)' : 'oklch(from var(--foreground) l c h / 0.35)',
        boxShadow: occupied
          ? '0 0 0 3px oklch(from var(--live) l c h / 0.18)'
          : '0 0 0 0 transparent',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn('rotate-45 border', baseClass)}
      aria-hidden="true"
    />
  )
}
