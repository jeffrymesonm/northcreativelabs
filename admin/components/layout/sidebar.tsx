'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants/nav'
import type { StaffRole } from '@/types'

export function Sidebar({ role }: { role: StaffRole }) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
      <div className="relative flex h-14 items-center overflow-hidden border-b border-sidebar-border px-4">
        <div className="pointer-events-none absolute -left-8 -top-10 size-32 rounded-full bg-signal/20 blur-3xl" />
        <span className="relative font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
          North Creative Labs
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-signal" />
              )}
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
