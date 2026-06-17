import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Me } from '@/lib/api'
import { apiServer } from '@/lib/api-server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let backend: { ok: true; me: Me } | { ok: false; error: string }
  try {
    backend = { ok: true, me: await apiServer<Me>('/api/me') }
  } catch (e) {
    backend = { ok: false, error: (e as Error).message }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action="/auth/signout" method="post">
          <Button variant="outline" size="sm" type="submit">
            <LogOut />
            Sign out
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backend session</CardTitle>
          <CardDescription>
            Verified by FastAPI from your Supabase access token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backend.ok ? (
            <p className="text-sm">
              Signed in as{' '}
              <span className="font-medium">
                {backend.me.email ?? backend.me.id}
              </span>
            </p>
          ) : (
            <p className="text-destructive text-sm">{backend.error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
