'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sign-out runs on the client: Amplify clears the cookie-backed session, so the
// server stops seeing it on the next request. (Cognito has no server signOut.)
export function SignOutButton() {
  const router = useRouter()

  async function onSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={onSignOut}>
      <LogOut />
      Sign out
    </Button>
  )
}
