import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/session'

// Auth-aware entry: send signed-in users to their dashboard, everyone else to
// login. There is no public landing page — `/` is purely a routing gate, so it
// can never present a "skip login" door.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getServerUser()
  redirect(user ? '/dashboard' : '/login')
}
