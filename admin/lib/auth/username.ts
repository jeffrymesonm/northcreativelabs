/**
 * Supabase Auth solo identifica usuarios por email (o teléfono). Para poder
 * pedir "usuario" en vez de email, cada cuenta de staff se crea con un email
 * interno determinístico a partir de su username — nunca se envía correo
 * a ese dominio, es solo el identificador que usa Supabase por dentro.
 */
const STAFF_EMAIL_DOMAIN = 'staff.northcreativelabs.local'

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username)
}

export function usernameToInternalEmail(username: string) {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`
}

/**
 * Acepta tanto un username nuevo como un email real ya existente (la
 * cuenta admin original, creada a mano en el Dashboard antes de que
 * existiera este sistema, sigue usando su email real).
 */
export function loginIdentifierToEmail(identifier: string) {
  const value = identifier.trim()
  return value.includes('@') ? value.toLowerCase() : usernameToInternalEmail(value)
}
