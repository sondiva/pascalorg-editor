import { createI18n } from '@pascal-app/core'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppHeader, AppShell, SECONDARY_PILL } from '@/components/app-shell'
import { resolvePublicUrl } from '@/lib/public-url'
import { resolveAuthMode } from '@/lib/self-host-auth'
import { PASCAL_LOCALE_HEADER, resolveUiLocale } from '@/lib/ui-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  return {
    title: i18n._({ id: 'app.settings.pageTitle', message: 'Settings · Pascal' }),
  }
}

/** Server components see headers, not a Request; the auth helpers want the latter. */
async function currentRequest(): Promise<Request> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return new Request(`${proto}://${host}/settings`, { headers: h })
}

export default async function SettingsPage() {
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  const request = await currentRequest()
  const publicUrl = resolvePublicUrl(request)
  const authMode = resolveAuthMode(request)
  const agentTokenConfigured = Boolean(process.env.PASCAL_SCENE_API_TOKEN)

  return (
    <AppShell>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          {i18n._({ id: 'app.settings.allProjects', message: 'All projects' })}
        </Link>
        <h1 className="mt-4 mb-8 font-semibold text-lg">
          {i18n._({ id: 'app.settings.heading', message: 'Settings' })}
        </h1>

        <div className="flex flex-col gap-6">
          <Section title={i18n._({ id: 'app.settings.instance', message: 'Instance' })}>
            <Row label={i18n._({ id: 'app.settings.publicUrl', message: 'Public URL' })}>
              <code className="font-mono">{publicUrl}</code>
            </Row>
            <Row label={i18n._({ id: 'app.settings.version', message: 'Version' })}>
              {/* i18n-ignore: fallback value when no version is set, not user copy */}
              {process.env.PASCAL_RUNTIME_VERSION || 'development'}
            </Row>
            <Row label={i18n._({ id: 'app.settings.dataDirectory', message: 'Data directory' })}>
              {/* i18n-ignore: default filesystem path, not user copy */}
              <code className="font-mono">{process.env.PASCAL_DATA_DIR || '~/.pascal/data'}</code>
            </Row>
          </Section>

          <Section title={i18n._({ id: 'app.settings.connectAgent', message: 'Connect an agent' })}>
            <Row label={i18n._({ id: 'app.settings.sceneApi', message: 'Scene API' })}>
              {/* i18n-ignore: API path suffix, not user copy */}
              <code className="font-mono">{publicUrl}/api/scenes</code>
            </Row>
            <Row label={i18n._({ id: 'app.settings.agentToken', message: 'Agent token' })}>
              {agentTokenConfigured
                ? i18n._({ id: 'app.settings.configured', message: 'Configured' })
                : i18n._({ id: 'app.settings.notConfigured', message: 'Not configured' })}
            </Row>
            <p className="px-4 py-3 text-muted-foreground text-xs">
              {agentTokenConfigured
                ? i18n._({
                    id: 'app.settings.agentTokenConfiguredHint',
                    message:
                      'Agents and scripts send the PASCAL_SCENE_API_TOKEN value in an Authorization: Bearer header.',
                  })
                : i18n._({
                    id: 'app.settings.agentTokenNotConfiguredHint',
                    message:
                      'Set PASCAL_SCENE_API_TOKEN on this instance, then send it in an Authorization: Bearer header from agents and scripts.',
                  })}
            </p>
          </Section>

          {authMode === 'password' && (
            <Section title={i18n._({ id: 'app.settings.account', message: 'Account' })}>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  {i18n._({
                    id: 'app.settings.signedInAsAdmin',
                    message: 'Signed in as the instance admin.',
                  })}
                </p>
                <form action="/api/auth/logout" method="post">
                  <button className={SECONDARY_PILL} type="submit">
                    {i18n._({ id: 'app.settings.signOut', message: 'Sign out' })}
                  </button>
                </form>
              </div>
            </Section>
          )}

          <Section title={i18n._({ id: 'app.settings.about', message: 'About' })}>
            <ExternalRow
              href="https://github.com/pascalorg/editor"
              label={i18n._({ id: 'app.settings.sourceCode', message: 'Source code' })}
            />
            <ExternalRow
              href="https://editor.pascal.app/docs"
              label={i18n._({ id: 'app.settings.documentation', message: 'Documentation' })}
            />
          </Section>
        </div>
      </main>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-medium text-muted-foreground text-xs">{title}</h2>
      <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-background">
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  )
}

function ExternalRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {href.replace(/^https:\/\//, '')}
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </a>
  )
}
