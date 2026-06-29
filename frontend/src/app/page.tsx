import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/session'
import { PublicApp } from '@/components/public/PublicApp'

// Auth-aware entry. A signed-in user goes to their dashboard; everyone else gets
// the login-free public demo graph (PublicApp) right here at "/", so a visitor —
// e.g. a judge — can experience the product end to end (upload → extract → graph →
// search → ask → edit) without an account, with a prefilled graph to start from
// and a Sign-in button to enter the real app. The proxy already treats "/" as
// public (see lib/auth/proxy PUBLIC_PATHS), so there is no redirect to /login.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getServerUser()
  if (user) redirect('/dashboard')
  return <PublicApp />
}
