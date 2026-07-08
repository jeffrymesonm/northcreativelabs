/**
 * Tipos escritos a mano siguiendo la forma exacta que genera
 * `npx supabase gen types typescript --project-id hmzjubswhwlkciwltyju`.
 * Cuando exista acceso para correr ese comando, este archivo se puede
 * reemplazar 1:1 sin tocar el resto del código (todo consume
 * Database['public']['Tables'][...]).
 *
 * Nota: los tipos Row de cada tabla se definen como alias nombrados
 * (LeadsRow, ProfilesRow, ...) en vez de referenciarse vía
 * Database['public']['Tables'][...]['Row'] dentro de la propia
 * interfaz — esa auto-referencia rompe la inferencia genérica de
 * supabase-js en .insert()/.update() (resuelve a `never`).
 */

export type StaffRole = 'admin' | 'ventas' | 'disenador' | 'client'

export type TaskStatus = 'pending' | 'done' | 'cancelled'

export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'step2_completed'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'file_added'
  | 'quote_created'
  | 'quote_status_changed'

export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada'

export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'esperando_respuesta'
  | 'reunion'
  | 'cotizacion_enviada'
  | 'negociacion'
  | 'ganado'
  | 'perdido'
  | 'archivado'

type LeadsRow = {
  id: string
  created_at: string
  updated_at: string
  name: string
  project_type: 'negocio' | 'portfolio' | 'landing' | 'e-commerce' | 'otro'
  budget: '100-300' | '300-600' | '600-1000' | '1000+' | null
  needs: string
  contact_info: string
  locale: 'es' | 'en' | 'de' | null
  step2_status: 'pending' | 'skipped' | 'completed'
  step2_completed_at: string | null
  business_name: string | null
  business_description: string | null
  has_website: boolean | null
  website_url: string | null
  goals: string[] | null
  goals_other: string | null
  features: string[] | null
  features_other: string | null
  existing_content: string[] | null
  design_reference_url: string | null
  design_style: string | null
  seo_location: string | null
  seo_main_service: string | null
  additional_info: string | null
  estado: LeadStatus
  assigned_to: string | null
  source: string
  archived: boolean
}

type ProfilesRow = {
  id: string
  full_name: string | null
  email: string | null
  username: string | null
  role: StaffRole | null
  active: boolean
  created_at: string
  updated_at: string
}

type LeadNotesRow = {
  id: string
  lead_id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
}

type LeadTasksRow = {
  id: string
  lead_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  assigned_to: string | null
  created_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

type LeadTaskCommentsRow = {
  id: string
  task_id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
}

type LeadActivityRow = {
  id: string
  lead_id: string
  actor_id: string | null
  type: ActivityType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type LeadFilesRow = {
  id: string
  lead_id: string
  storage_path: string
  file_name: string
  file_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

type QuotesRow = {
  id: string
  lead_id: string
  version: number
  amount: number
  currency: string
  status: QuoteStatus
  notes: string | null
  pdf_storage_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type QuoteItemsRow = {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit_price: number
  sort_order: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: LeadsRow
        Insert: Partial<LeadsRow> & {
          name: string
          project_type: LeadsRow['project_type']
          needs: string
          contact_info: string
        }
        Update: Partial<LeadsRow>
        Relationships: []
      }
      profiles: {
        Row: ProfilesRow
        Insert: Partial<ProfilesRow> & { id: string }
        Update: Partial<ProfilesRow>
        Relationships: []
      }
      lead_notes: {
        Row: LeadNotesRow
        Insert: Partial<LeadNotesRow> & { lead_id: string; body: string }
        Update: Partial<LeadNotesRow>
        Relationships: []
      }
      lead_tasks: {
        Row: LeadTasksRow
        Insert: Partial<LeadTasksRow> & { lead_id: string; title: string }
        Update: Partial<LeadTasksRow>
        Relationships: []
      }
      lead_task_comments: {
        Row: LeadTaskCommentsRow
        Insert: Partial<LeadTaskCommentsRow> & { task_id: string; body: string }
        Update: Partial<LeadTaskCommentsRow>
        Relationships: []
      }
      lead_activity: {
        Row: LeadActivityRow
        Insert: Partial<LeadActivityRow> & { lead_id: string; type: ActivityType; description: string }
        Update: Partial<LeadActivityRow>
        Relationships: []
      }
      lead_files: {
        Row: LeadFilesRow
        Insert: Partial<LeadFilesRow> & { lead_id: string; storage_path: string; file_name: string }
        Update: Partial<LeadFilesRow>
        Relationships: []
      }
      quotes: {
        Row: QuotesRow
        Insert: Partial<QuotesRow> & { lead_id: string; amount: number }
        Update: Partial<QuotesRow>
        Relationships: []
      }
      quote_items: {
        Row: QuoteItemsRow
        Insert: Partial<QuoteItemsRow> & { quote_id: string; description: string; unit_price: number }
        Update: Partial<QuoteItemsRow>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      staff_role: StaffRole
      lead_status: LeadStatus
    }
    Functions: {
      create_quote_with_items: {
        Args: {
          p_lead_id: string
          p_currency: string | null
          p_notes: string | null
          p_items: { description: string; quantity: number; unit_price: number }[]
        }
        Returns: string
      }
      update_lead_step2: {
        Args: {
          p_lead_id: string
          p_business_name?: string | null
          p_business_description?: string | null
          p_has_website?: boolean | null
          p_website_url?: string | null
          p_goals?: string[] | null
          p_goals_other?: string | null
          p_features?: string[] | null
          p_features_other?: string | null
          p_existing_content?: string[] | null
          p_design_reference_url?: string | null
          p_design_style?: string | null
          p_seo_location?: string | null
          p_seo_main_service?: string | null
          p_additional_info?: string | null
          p_step2_status?: string | null
        }
        Returns: void
      }
    }
  }
}
