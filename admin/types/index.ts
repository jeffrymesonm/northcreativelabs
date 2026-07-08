import type { ActivityType, Database, LeadStatus, QuoteStatus, StaffRole, TaskStatus } from './database'

export type { ActivityType, LeadStatus, QuoteStatus, StaffRole, TaskStatus }
export type LeadRow = Database['public']['Tables']['leads']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type LeadNoteRow = Database['public']['Tables']['lead_notes']['Row']
export type LeadTaskRow = Database['public']['Tables']['lead_tasks']['Row']
export type LeadTaskCommentRow = Database['public']['Tables']['lead_task_comments']['Row']
export type LeadActivityRow = Database['public']['Tables']['lead_activity']['Row']
export type LeadFileRow = Database['public']['Tables']['lead_files']['Row']
export type QuoteRow = Database['public']['Tables']['quotes']['Row']
export type QuoteItemRow = Database['public']['Tables']['quote_items']['Row']

export type LeadWithAssignee = LeadRow & {
  assignee: Pick<ProfileRow, 'id' | 'full_name'> | null
}

export type LeadNoteWithAuthor = LeadNoteRow & {
  author: Pick<ProfileRow, 'id' | 'full_name'> | null
}

export type LeadTaskCommentWithAuthor = LeadTaskCommentRow & {
  author: Pick<ProfileRow, 'id' | 'full_name'> | null
}

export type LeadTaskWithAssignee = LeadTaskRow & {
  assignee: Pick<ProfileRow, 'id' | 'full_name'> | null
  comments: LeadTaskCommentWithAuthor[]
}

export type LeadActivityWithActor = LeadActivityRow & {
  actor: Pick<ProfileRow, 'id' | 'full_name'> | null
}

export type LeadFileWithUploader = LeadFileRow & {
  uploader: Pick<ProfileRow, 'id' | 'full_name'> | null
  signedUrl: string | null
}

export type QuoteWithCreator = QuoteRow & {
  creator: Pick<ProfileRow, 'id' | 'full_name'> | null
  pdfSignedUrl: string | null
  items: QuoteItemRow[]
}
