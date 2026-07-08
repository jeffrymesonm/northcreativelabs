import { MobileNav } from '@/components/layout/mobile-nav'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { LiveIndicator } from '@/components/realtime/live-indicator'
import type { ProfileRow } from '@/types'

export function Topbar({ profile }: { profile: ProfileRow }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <MobileNav role={profile.role!} />
      <div className="flex items-center gap-2 sm:gap-4">
        <LiveIndicator />
        <ThemeToggle />
        <UserMenu fullName={profile.full_name} role={profile.role!} />
      </div>
    </header>
  )
}
