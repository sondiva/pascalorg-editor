import { createI18n, type MessageDescriptor } from '@pascal-app/core'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { AppCard } from '@/components/app-shell'
import { PASCAL_LOCALE_HEADER, resolveUiLocale } from '@/lib/ui-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  return {
    title: i18n._({ id: 'app.setup.pageTitle', message: 'Set up · Pascal' }),
  }
}

const VARIABLES: ReadonlyArray<readonly [string, MessageDescriptor]> = [
  [
    'PASCAL_ADMIN_PASSWORD',
    /* i18n */ {
      id: 'app.setup.adminPassword',
      message: 'The password that unlocks this editor. Required on a network host.',
    },
  ],
  [
    'PASCAL_PUBLIC_URL',
    /* i18n */ {
      id: 'app.setup.publicUrl',
      message: 'The address people use to reach it, for example https://pascal.example.com.',
    },
  ],
  [
    'PASCAL_SCENE_API_TOKEN',
    /* i18n */ {
      id: 'app.setup.sceneApiToken',
      message: 'Optional. A bearer token for agents and scripts calling the scene API.',
    },
  ],
  [
    'PASCAL_AUTH=proxy',
    /* i18n */ {
      id: 'app.setup.authProxy',
      message:
        'Alternative to a password when a reverse proxy already authenticates every request.',
    },
  ],
]

export default async function SetupPage() {
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  return (
    <AppCard className="max-w-lg">
      <h1 className="mt-6 font-semibold text-lg">
        {i18n._({
          id: 'app.setup.notProtectedYet',
          message: 'This editor is reachable but not protected yet',
        })}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        {i18n._({
          id: 'app.setup.setPasswordHint',
          message:
            'Set an admin password in the environment and restart. Until then, nothing is served from this address.',
        })}
      </p>
      <dl className="mt-5 flex flex-col divide-y divide-border/50 rounded-xl border border-border/50">
        {VARIABLES.map(([name, description]) => (
          <div className="px-4 py-3" key={name}>
            <dt className="font-mono text-sm">{name}</dt>
            <dd className="mt-0.5 text-muted-foreground text-xs">{i18n._(description)}</dd>
          </div>
        ))}
      </dl>
    </AppCard>
  )
}
