import { getLeads, type LeadsSearchParams } from '@/lib/supabase/queries/leads'
import { getStaffProfiles } from '@/lib/supabase/queries/profiles'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { CreateLeadSheet } from './create-lead-sheet'
import { LeadsTable } from './leads-table'
import { LeadsToolbar } from './leads-toolbar'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSearchParams>
}) {
  const params = await searchParams
  const [{ rows, totalCount, page, pageSize }, staff, currentProfile] = await Promise.all([
    getLeads(params),
    getStaffProfiles(),
    getCurrentProfile(),
  ])

  const canBulkEdit = currentProfile?.role === 'admin' || currentProfile?.role === 'ventas'
  const isAdmin = currentProfile?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Todas las solicitudes recibidas desde el sitio público.</p>
        </div>
        {canBulkEdit && <CreateLeadSheet staff={staff} />}
      </div>
      <LeadsToolbar />
      <LeadsTable
        data={rows}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        staff={staff}
        canBulkEdit={canBulkEdit}
        isAdmin={isAdmin}
      />
    </div>
  )
}
