'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** The door from the public demo into the real (authenticated) app. Rendered in
 *  the demo topbar and sidebar footer so a visitor can always sign in / sign up. */
export function SignInButton({ className }: { className?: string }) {
  return (
    <Button asChild size="sm" className={className}>
      <Link href="/login">
        <LogIn className="size-3.5" />
        Sign in
      </Link>
    </Button>
  )
}
