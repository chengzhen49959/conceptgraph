'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  signIn,
  signOut,
  confirmSignUp,
  resendSignUpCode,
} from 'aws-amplify/auth'
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

// Amplify throws UserAlreadyAuthenticatedException when a (possibly stale) session
// already exists — e.g. landing on /login while still signed in. Clear it and
// retry so the credentials just entered win (this also lets a user switch
// accounts straight from the login form instead of dead-ending on the error).
async function signInClean(username: string, password: string) {
  try {
    return await signIn({ username, password })
  } catch (err) {
    if ((err as Error).name === 'UserAlreadyAuthenticatedException') {
      await signOut()
      return await signIn({ username, password })
    }
    throw err
  }
}

export default function LoginPage() {
  // A login attempt by an unconfirmed user drops into the 'confirm' step so the
  // code can be entered here, rather than dead-ending on an error.
  const [step, setStep] = useState<'login' | 'confirm'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function goDashboard() {
    // Full-document navigation (not router.push) so the browser sends the
    // freshly-set Cognito auth cookies and the server gate re-evaluates with the
    // new session. A client RSC navigation can race the cookie write and bounce
    // straight back to /login — which looks like "login did nothing".
    //
    // Honour a `?next=` redirect (e.g. arriving from an invite link), but only
    // for in-app relative paths — reject absolute/protocol-relative URLs so the
    // param can't be used as an open redirect.
    const next = new URLSearchParams(window.location.search).get('next')
    const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    window.location.assign(dest)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      const { isSignedIn, nextStep } = await signInClean(email, password)
      if (isSignedIn) {
        await goDashboard()
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // Unconfirmed account: send a fresh code and collect it here.
        await resendSignUpCode({ username: email })
        setStep('confirm')
        setNotice(`We sent a confirmation code to ${email}.`)
      } else {
        setError(`Additional step required: ${nextStep.signInStep}`)
      }
    } catch (err) {
      // Some Amplify versions throw instead of returning the next step.
      if ((err as Error).name === 'UserNotConfirmedException') {
        await resendSignUpCode({ username: email })
        setStep('confirm')
        setNotice(`We sent a confirmation code to ${email}.`)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      // Account is verified now — sign in with the password from the form.
      const { isSignedIn } = await signInClean(email, password)
      if (isSignedIn) await goDashboard()
      else setStep('login')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    setError(null)
    setNotice(null)
    try {
      await resendSignUpCode({ username: email })
      setNotice(`We sent a new code to ${email}.`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 'login' ? 'Log in' : 'Confirm your email'}
          </CardTitle>
          <CardDescription>
            {step === 'login'
              ? 'Welcome back. Enter your details.'
              : `Enter the code we sent to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'login' ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Logging in' : 'Log in'}
              </Button>
              {notice && <p className="text-muted-foreground text-sm">{notice}</p>}
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
                {loading ? 'Confirming' : 'Confirm & sign in'}
              </Button>
              {notice && <p className="text-muted-foreground text-sm">{notice}</p>}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button
                type="button"
                onClick={onResend}
                className="text-muted-foreground text-sm underline self-start"
              >
                Resend code
              </button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-muted-foreground text-sm">
          No account?
          <Link href="/signup" className="text-foreground ml-1 underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
