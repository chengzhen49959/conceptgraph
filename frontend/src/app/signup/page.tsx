'use client'

import { useState } from 'react'
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

  // After confirmation, Amplify can finish the pending sign-in automatically.
  async function finishAutoSignIn() {
    const { isSignedIn } = await autoSignIn()
    if (isSignedIn) {
      router.push('/dashboard')
      router.refresh()
    } else {
      router.push('/login')
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
        router.push('/login')
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
        router.push('/login')
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
          <Link href="/login" className="text-foreground ml-1 underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
