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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border max-w-2xl mx-auto"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5 transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-body font-medium">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
