import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { LeadNotifications } from '@/components/realtime/lead-notifications'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()

  if (!profile || !profile.role || !profile.active) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      <LeadNotifications />
      <Sidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  )
}
