import { createI18n } from '@pascal-app/core'
import type { SceneGraph } from '@pascal-app/editor'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { EmbedViewer } from '@/components/embed-viewer'
import { isSceneShared } from '@/lib/scene-sharing'
import { getSceneOperations } from '@/lib/scene-store-server'
import { PASCAL_LOCALE_HEADER, resolveUiLocale } from '@/lib/ui-locale'

export const dynamic = 'force-dynamic'

interface SharedScene {
  name: string
  graph: SceneGraph
}

// Metadata and the page both need the scene; `cache` loads it once per request.
const loadSharedScene = cache(async (id: string): Promise<SharedScene | null> => {
  // `isSceneShared` throws on an id that cannot be a scene; that is a 404 here, not a 500.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !(await isSceneShared(id))) return null
  const operations = await getSceneOperations()
  return (await operations.loadStoredScene(id)) as SharedScene | null
})

export async function generateMetadata({ params }: PageProps<'/embed/[id]'>): Promise<Metadata> {
  const { id } = await params
  const scene = await loadSharedScene(id)
  const i18n = createI18n({ locale: resolveUiLocale((await headers()).get(PASCAL_LOCALE_HEADER)) })
  return {
    title: scene
      ? i18n._({
          id: 'app.embed.pageTitle',
          message: '{name} · Pascal',
          values: { name: scene.name },
        })
      : 'Pascal',
    robots: { index: false },
  }
}

export default async function EmbedPage({ params, searchParams }: PageProps<'/embed/[id]'>) {
  const [{ id }, { ui }] = await Promise.all([params, searchParams])
  const scene = await loadSharedScene(id)
  if (!scene) notFound()
  // `?ui=0` is the bare 3D view: no header, controls bar or 3D/2D switcher.
  const chrome = ui !== '0' && ui !== 'false'
  return <EmbedViewer chrome={chrome} graph={scene.graph} id={id} name={scene.name} />
}
