import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BUDGET_LABELS,
  EXISTING_CONTENT_LABELS,
  FEATURE_LABELS,
  GOAL_LABELS,
  PROJECT_TYPE_LABELS,
} from '@/lib/constants/leads'
import type { LeadWithAssignee } from '@/types'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  )
}

function BadgeList({ values, labels }: { values: string[] | null; labels: Record<string, string> }) {
  if (!values?.length) return <p className="text-sm text-muted-foreground">—</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Badge key={value} variant="secondary">
          {labels[value] ?? value}
        </Badge>
      ))}
    </div>
  )
}

export function OverviewTab({ lead }: { lead: LeadWithAssignee }) {
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paso 1 — Solicitud inicial</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Nombre" value={lead.name} />
          <Field label="Tipo de proyecto" value={PROJECT_TYPE_LABELS[lead.project_type] ?? lead.project_type} />
          <Field label="Presupuesto" value={lead.budget ? (BUDGET_LABELS[lead.budget] ?? lead.budget) : null} />
          <Field label="Contacto" value={lead.contact_info} />
          <Field label="Fuente" value={lead.source} />
          <Field label="Idioma" value={lead.locale} />
          <Field label="Creado" value={dateFormatter.format(new Date(lead.created_at))} />
          <div className="col-span-2">
            <Field label="¿Qué necesita?" value={lead.needs} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paso 2 — Sobre el negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Nombre del negocio" value={lead.business_name} />
          <Field
            label="¿Tiene página web?"
            value={lead.has_website == null ? null : lead.has_website ? (lead.website_url ?? 'Sí') : 'No'}
          />
          <div className="col-span-2">
            <Field label="Descripción" value={lead.business_description} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objetivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BadgeList values={lead.goals} labels={GOAL_LABELS} />
          {lead.goals_other && <Field label="Otro objetivo" value={lead.goals_other} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BadgeList values={lead.features} labels={FEATURE_LABELS} />
          {lead.features_other && <Field label="Otra funcionalidad" value={lead.features_other} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contenido disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeList values={lead.existing_content} labels={EXISTING_CONTENT_LABELS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diseño y SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Referencia de diseño" value={lead.design_reference_url} />
          <Field label="Estilo buscado" value={lead.design_style} />
          <Field label="Ciudad / país" value={lead.seo_location} />
          <Field label="Servicio principal" value={lead.seo_main_service} />
        </CardContent>
      </Card>

      {lead.additional_info && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Información adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.additional_info}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
