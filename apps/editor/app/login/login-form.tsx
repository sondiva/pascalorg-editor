'use client'

import { usePascalI18n } from '@pascal-app/core'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { PRIMARY_PILL } from '@/components/app-shell'
import { cn } from '@/lib/utils'

export function LoginForm({ next }: { next: string }) {
  const i18n = usePascalI18n()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (response.status === 429) {
        setError(
          i18n._({
            id: 'app.login.loginForm.tooManyAttemptsTryAgainIn',
            message: 'Too many attempts. Try again in a minute.',
          }),
        )
        return
      }
      if (!response.ok) {
        setError(
          i18n._({
            id: 'app.login.loginForm.thatPasswordIsNotRight',
            message: 'That password is not right.',
          }),
        )
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError(
        i18n._({
          id: 'app.login.loginForm.couldNotReachTheEditor',
          message: 'Could not reach the editor.',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          {i18n._({ id: 'app.login.loginForm.password', message: 'Password' })}
        </span>
        <input
          autoComplete="current-password"
          className="rounded-lg border border-input bg-accent px-3 py-2 text-sm outline-none focus:border-ring"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <button
        className={cn(PRIMARY_PILL, 'mt-1 py-2')}
        disabled={submitting || password.length === 0}
        type="submit"
      >
        {submitting
          ? i18n._({ id: 'app.login.loginForm.signingIn', message: 'Signing in…' })
          : i18n._({ id: 'app.login.loginForm.signIn', message: 'Sign in' })}
      </button>
    </form>
  )
}
