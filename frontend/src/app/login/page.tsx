'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  signIn,
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

export default function LoginPage() {
  const router = useRouter()
  // A login attempt by an unconfirmed user drops into the 'confirm' step so the
  // code can be entered here, rather than dead-ending on an error.
  const [step, setStep] = useState<'login' | 'confirm'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function goDashboard() {
    router.push('/dashboard')
    router.refresh()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
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
      const { isSignedIn } = await signIn({ username: email, password })
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
