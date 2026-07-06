import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UnauthorizedPage() {
  const profile = await getCurrentProfile()

  // Si el usuario ya tiene rol activo, no tiene nada que hacer aquí.
  if (profile?.role && profile.active) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cuenta sin acceso</CardTitle>
          <CardDescription>
            Tu cuenta todavía no tiene un rol asignado en el CRM, o fue desactivada. Contacta a un
            administrador de North Creative Labs para que active tu acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton variant="outline" className="w-full">
            Cerrar sesión
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  )
}
