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
  lg: { container: 'w-28 h-28', base: 'w-7 h-7' },
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
      {/* Diamond outline using rotated squares */}
      {/* Second base — top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <BaseDiamond occupied={second} label="second" baseClass={base} />
      </div>
      {/* Third base — left */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <BaseDiamond occupied={third} label="third" baseClass={base} />
      </div>
      {/* First base — right */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <BaseDiamond occupied={first} label="first" baseClass={base} />
      </div>
      {/* Home plate — bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div className={cn('rotate-45 border border-muted-foreground/30 bg-transparent', base)} />
      </div>
      {/* Diamond lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60%] h-[60%] rotate-45 border border-muted-foreground/20" />
      </div>
    </div>
  )
}

function BaseDiamond({
  occupied,
  label,
  baseClass,
}: {
  occupied: boolean
  label: string
  baseClass: string
}) {
  return (
    <div
      className={cn(
        'rotate-45 transition-colors duration-150',
        baseClass,
        occupied
          ? 'bg-primary border-primary'
          : 'bg-transparent border-muted-foreground/40 border'
      )}
      aria-hidden="true"
    />
  )
}
