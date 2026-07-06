'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export async function uploadLeadFile(leadId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona un archivo.' }

  const supabase = await createClient()
  const storagePath = `${leadId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from('lead-files').upload(storagePath, file)
  if (uploadError) return { error: 'No se pudo subir el archivo.' }

  const { error: dbError } = await supabase.from('lead_files').insert({
    lead_id: leadId,
    storage_path: storagePath,
    file_name: file.name,
    file_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: profile.id,
  })

  if (dbError) {
    await supabase.storage.from('lead-files').remove([storagePath])
    return { error: 'No se pudo guardar la referencia del archivo.' }
  }

  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function deleteLeadFile(fileId: string, leadId: string, storagePath: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { error: storageError } = await supabase.storage.from('lead-files').remove([storagePath])
  if (storageError) return { error: 'No se pudo borrar el archivo.' }

  const { error: dbError } = await supabase.from('lead_files').delete().eq('id', fileId)
  if (dbError) return { error: 'No se pudo borrar la referencia del archivo.' }

  revalidatePath(`/leads/${leadId}`)
  return {}
}
