'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { signUp, confirmSignUp, autoSignIn } from 'aws-amplify/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  // Cognito sign-up is two steps: register, then confirm an emailed code.
  const [step, setStep] = useState<'register' | 'confirm'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // A `?next=` destination (e.g. arriving from an invite/share link), captured
  // client-side. Only in-app relative paths are kept, so it can't be an open
  // redirect. Carried through to /login and honoured after auto sign-in so a
  // brand-new invitee lands back on the accept page instead of /dashboard.
  const [next, setNext] = useState<string | null>(null)
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next')
    setNext(n && n.startsWith('/') && !n.startsWith('//') ? n : null)
  }, [])
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login'

  // After confirmation, Amplify can finish the pending sign-in automatically.
  async function finishAutoSignIn() {
    const { isSignedIn } = await autoSignIn()
    if (isSignedIn) {
      // Full-document navigation so the freshly-set Cognito cookies reach the
      // server gate (a client navigation can race the cookie write).
      window.location.assign(next ?? '/dashboard')
    } else {
      router.push(loginHref)
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: { userAttributes: { email }, autoSignIn: true },
      })
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('confirm')
      } else if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
        await finishAutoSignIn()
      } else {
        router.push(loginHref)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      })
      if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
        await finishAutoSignIn()
      } else {
        router.push(loginHref)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 'register' ? 'Sign up' : 'Confirm your email'}
          </CardTitle>
          <CardDescription>
            {step === 'register'
              ? 'Create an account to get started.'
              : `Enter the code we sent to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'register' ? (
            <form onSubmit={onRegister} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Creating account' : 'Sign up'}
              </Button>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </form>
          ) : (
            <form onSubmit={onConfirm} className="flex flex-col gap-3">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Confirmation code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Confirming' : 'Confirm'}
              </Button>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </form>
          )}
        </CardContent>
        <CardFooter className="text-muted-foreground text-sm">
          Already have an account?
          <Link href={loginHref} className="text-foreground ml-1 underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
