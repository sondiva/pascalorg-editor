import { createI18n } from '@pascal-app/core'
import { headers } from 'next/headers'
import Link from 'next/link'
import { PASCAL_LOCALE_HEADER, resolveUiLocale } from '@/lib/ui-locale'
import { ImportClient } from './import-client'

export const dynamic = 'force-dynamic'

/**
 * `/import?src=<https-url>[&name=<scene name>]` — the hand-off point for
 * scanning apps and other external tools: they host a build JSON at a
 * URL (CORS-enabled) and open this page; the visitor reviews what the
 * file contains and imports it as a new scene of their own.
 */
export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string; name?: string }>
}) {
  const params = await searchParams
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              {i18n._({ id: 'app.import.home', message: 'Home' })}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">
              {i18n._({ id: 'app.import.import', message: 'Import' })}
            </span>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 font-bold text-3xl">
          {i18n._({ id: 'app.import.importAScene', message: 'Import a scene' })}
        </h1>
        <p className="mb-8 text-muted-foreground text-sm">
          {i18n._({
            id: 'app.import.reviewBefore',
            message:
              'Review the file before it becomes a scene. Nothing is created until you confirm.',
          })}
        </p>
        {/* Keyed by src: a new file is a new flow — state (scene name,
            phase) must never leak from the previous one. */}
        <ImportClient key={params.src} name={params.name ?? null} src={params.src ?? null} />
      </main>
    </div>
  )
}
