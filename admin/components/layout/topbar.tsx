import { MobileNav } from '@/components/layout/mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import type { ProfileRow } from '@/types'

export function Topbar({ profile }: { profile: ProfileRow }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <MobileNav role={profile.role!} />
      <UserMenu fullName={profile.full_name} role={profile.role!} />
    </header>
  )
}
