'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, CircleDot, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/leagues', label: 'League', icon: Trophy },
  { href: '/games', label: 'Game', icon: CircleDot },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border max-w-2xl mx-auto"
      aria-label="Main navigation"
    >
      {/* Stitch rule across the top of the nav — the bat-rack detail */}
      <div aria-hidden="true" className="stitch-rule opacity-70" />

      <ul className="flex items-stretch h-16 pt-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1 relative">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1 transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stitch rounded-b-sm"
                  />
                )}
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-all',
                    active && 'stroke-[2.25]'
                  )}
                  aria-hidden="true"
                />
                <span className="font-display text-[10px] tracking-[0.2em] uppercase font-700">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
