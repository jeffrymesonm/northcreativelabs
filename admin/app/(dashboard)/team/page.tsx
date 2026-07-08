import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { getAllProfiles } from '@/lib/supabase/queries/profiles'
import { CreateStaffForm } from './create-staff-form'
import { StaffRow } from './staff-row'

export default async function TeamPage() {
  const currentProfile = await getCurrentProfile()
  if (currentProfile?.role !== 'admin') redirect('/')

  const profiles = await getAllProfiles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Equipo</h1>
        <p className="text-sm text-muted-foreground">Crea cuentas y administra roles del equipo.</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <CreateStaffForm />
      </div>

      <ul className="space-y-2">
        {profiles.map((profile, index) => (
          <StaffRow
            key={profile.id}
            profile={profile}
            isSelf={profile.id === currentProfile.id}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </ul>
    </div>
  )
}
