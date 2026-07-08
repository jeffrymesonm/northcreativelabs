import { notFound } from 'next/navigation'
import {
  getLeadActivity,
  getLeadById,
  getLeadFiles,
  getLeadNotes,
  getLeadTasks,
  getQuotes,
} from '@/lib/supabase/queries/lead-detail'
import { getStaffProfiles } from '@/lib/supabase/queries/profiles'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadHeader } from './lead-header'
import { OverviewTab } from './overview-tab'
import { TimelineTab } from './timeline-tab'
import { NotesTab } from './notes-tab'
import { TasksTab } from './tasks-tab'
import { FilesTab } from './files-tab'
import { QuotesTab } from './quotes-tab'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [lead, notes, tasks, activity, files, quotes, staff, currentProfile] = await Promise.all([
    getLeadById(id),
    getLeadNotes(id),
    getLeadTasks(id),
    getLeadActivity(id),
    getLeadFiles(id),
    getQuotes(id),
    getStaffProfiles(),
    getCurrentProfile(),
  ])

  if (!lead) notFound()

  const canEdit = currentProfile?.role === 'admin' || currentProfile?.role === 'ventas'
  const isAdmin = currentProfile?.role === 'admin'

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} staff={staff} canEdit={canEdit} isAdmin={isAdmin} />

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notas">Notas ({notes.length})</TabsTrigger>
          <TabsTrigger value="tareas">Tareas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="archivos">Archivos ({files.length})</TabsTrigger>
          <TabsTrigger value="cotizaciones">Cotizaciones ({quotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <OverviewTab lead={lead} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <TimelineTab activity={activity} />
        </TabsContent>
        <TabsContent value="notas" className="mt-4">
          <NotesTab leadId={lead.id} notes={notes} currentUserId={currentProfile?.id} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="tareas" className="mt-4">
          <TasksTab
            leadId={lead.id}
            tasks={tasks}
            staff={staff}
            currentUserId={currentProfile?.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="archivos" className="mt-4">
          <FilesTab leadId={lead.id} files={files} currentUserId={currentProfile?.id} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="cotizaciones" className="mt-4">
          <QuotesTab leadId={lead.id} quotes={quotes} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
