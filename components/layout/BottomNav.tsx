'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, CircleDot, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/leagues', label: 'Leagues', icon: Trophy },
  { href: '/games', label: 'Games', icon: CircleDot },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch h-12">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1 relative">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5 transition-colors tap',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-[19px] w-[19px] transition-transform',
                    active && 'stroke-[2.25]'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[9.5px] font-semibold tracking-[0.06em] uppercase leading-none',
                    !active && 'opacity-70'
                  )}
                >
                  {label}
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-foreground"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
