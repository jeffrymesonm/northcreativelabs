import * as z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, { error: 'Ingresa tu usuario.' }),
  password: z.string().min(1, { error: 'Ingresa tu contraseña.' }),
})

export type LoginInput = z.infer<typeof loginSchema>
