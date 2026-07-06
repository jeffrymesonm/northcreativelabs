import type { ActivityType, LeadStatus, QuoteStatus, StaffRole } from '@/types'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  esperando_respuesta: 'Esperando respuesta',
  reunion: 'Reunión',
  cotizacion_enviada: 'Cotización enviada',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
  archivado: 'Archivado',
}

/** Clases de color (fondo/texto) por estado, para el badge de la tabla. */
export const LEAD_STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  nuevo: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  contactado: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  esperando_respuesta: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  reunion: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  cotizacion_enviada: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  negociacion: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  ganado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  perdido: 'bg-red-500/15 text-red-600 dark:text-red-400',
  archivado: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  'nuevo',
  'contactado',
  'esperando_respuesta',
  'reunion',
  'cotizacion_enviada',
  'negociacion',
  'ganado',
  'perdido',
  'archivado',
]

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  negocio: 'Negocio Local',
  portfolio: 'Portafolio / CV',
  landing: 'Landing Page',
  'e-commerce': 'E-commerce',
  otro: 'Otro',
}

export const BUDGET_LABELS: Record<string, string> = {
  '100-300': '$100 – $300',
  '300-600': '$300 – $600',
  '600-1000': '$600 – $1.000',
  '1000+': '$1.000+',
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  ventas: 'Ventas',
  disenador: 'Diseñador',
  client: 'Cliente',
}

/** Mismas etiquetas que translations.js (es) del sitio público, para consistencia. */
export const GOAL_LABELS: Record<string, string> = {
  more_clients: 'Conseguir más clientes',
  sell_products: 'Vender productos',
  show_services: 'Mostrar mis servicios',
  bookings: 'Recibir reservas',
  quotes: 'Recibir cotizaciones',
  automate: 'Automatizar procesos',
  improve_existing: 'Mejorar una página existente',
  other: 'Otro',
}

export const FEATURE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  contact_form: 'Formulario de contacto',
  booking_calendar: 'Agenda de citas',
  online_store: 'Tienda online',
  blog: 'Blog',
  chat: 'Chat',
  client_area: 'Área privada para clientes',
  user_login: 'Login de usuarios',
  admin_panel: 'Panel administrativo',
  social_integration: 'Integración con redes sociales',
  online_payments: 'Pagos online',
  seo: 'SEO',
  multilanguage: 'Multilenguaje',
  other: 'Otro',
}

export const EXISTING_CONTENT_LABELS: Record<string, string> = {
  logo: 'Logo',
  brand_manual: 'Manual de marca',
  photos: 'Fotos',
  videos: 'Videos',
  texts: 'Textos',
  catalog: 'Catálogo',
  domain: 'Dominio',
  hosting: 'Hosting',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  created: 'Lead creado',
  status_changed: 'Cambio de estado',
  assigned: 'Reasignación',
  step2_completed: 'Paso 2 completado',
  note_added: 'Nota agregada',
  task_created: 'Tarea creada',
  task_completed: 'Tarea completada',
  file_added: 'Archivo agregado',
  quote_created: 'Cotización creada',
  quote_status_changed: 'Cambio de estado de cotización',
}

export const TASK_STATUS_LABELS = {
  pending: 'Pendiente',
  done: 'Completada',
  cancelled: 'Cancelada',
} as const

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  expirada: 'Expirada',
}

export const QUOTE_STATUS_BADGE_CLASS: Record<QuoteStatus, string> = {
  borrador: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  enviada: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  aceptada: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rechazada: 'bg-red-500/15 text-red-600 dark:text-red-400',
  expirada: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

export const QUOTE_STATUS_OPTIONS: QuoteStatus[] = ['borrador', 'enviada', 'aceptada', 'rechazada', 'expirada']
