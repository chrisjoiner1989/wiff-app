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
      {/* Chalk-line base path — the visible diamond */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[72%] h-[72%] rotate-45 border-[1.5px] border-dashed border-foreground/20" />
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
      {/* Home plate — bottom, always drawn as an outlined chalk mark */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div
          className={cn(
            'rotate-45 border-[1.5px] border-foreground/45 bg-background',
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
    <div
      className={cn(
        'relative rotate-45 transition-all duration-200',
        baseClass,
        occupied
          ? 'bg-stitch border-[1.5px] border-stitch shadow-[0_0_0_2px_oklch(from_var(--stitch)_l_c_h_/_0.15)]'
          : 'bg-transparent border-[1.5px] border-foreground/40'
      )}
      aria-hidden="true"
    />
  )
}
