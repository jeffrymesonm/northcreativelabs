import Link from 'next/link'
import { NAV_ITEMS } from '@/lib/constants/nav'
import type { StaffRole } from '@/types'

export function Sidebar({ role }: { role: StaffRole }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/20 md:block">
      <div className="flex h-14 items-center border-b px-4 font-semibold">North Creative Labs</div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
