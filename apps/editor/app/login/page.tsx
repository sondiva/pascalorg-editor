import { createI18n } from '@pascal-app/core'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { AppCard } from '@/components/app-shell'
import { resolvePublicUrl } from '@/lib/public-url'
import { safeNextPath } from '@/lib/safe-next-path'
import { PASCAL_LOCALE_HEADER, resolveUiLocale } from '@/lib/ui-locale'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  return {
    title: i18n._({ id: 'app.login.pageTitle', message: 'Sign in · Pascal' }),
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  const origin = resolvePublicUrl(
    new Request('http://localhost/login', { headers: await headers() }),
  )
  return (
    <AppCard>
      <h1 className="mt-6 font-semibold text-lg">
        {i18n._({ id: 'app.login.heading', message: 'Sign in to this editor' })}
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
        {i18n._({
          id: 'app.login.adminPasswordHint',
          message: 'Enter the admin password set for this instance.',
        })}
      </p>
      <LoginForm next={safeNextPath(next, origin)} />
    </AppCard>
  )
}
