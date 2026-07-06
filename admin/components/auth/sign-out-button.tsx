'use client'

import { useTransition } from 'react'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

export function SignOutButton({ children, ...props }: ComponentProps<typeof Button>) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button onClick={() => startTransition(() => signOut())} disabled={isPending} {...props}>
      {children}
    </Button>
  )
}
