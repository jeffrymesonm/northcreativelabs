import { LayoutDashboard, Users, UserCog } from 'lucide-react'
import type { StaffRole } from '@/types'

export const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; roles: StaffRole[] }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'ventas', 'disenador'] },
  { href: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'ventas', 'disenador'] },
  { href: '/team', label: 'Equipo', icon: UserCog, roles: ['admin'] },
]
