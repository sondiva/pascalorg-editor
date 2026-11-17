'use client'

import { usePascalI18n } from '@pascal-app/core'
import type { SceneGraph } from '@pascal-app/editor'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { PRIMARY_PILL } from './app-shell'

const EMPTY_GRAPH: SceneGraph = {
  nodes: {},
  rootNodeIds: [],
}

/**
 * Creates an empty project named after its number and opens it. The number
 * comes from the server-rendered list so it never collides with a project
 * that still exists.
 */
export function CreateProjectButton({ nextNumber }: { nextNumber: number }) {
  const i18n = usePascalI18n()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Project #${nextNumber}`, graph: EMPTY_GRAPH }),
      })
      if (!response.ok) {
        setError(
          i18n._({
            id: 'app.createProjectButton.failedToCreateProjectStatus',
            message: 'Failed to create project ({status})',
            values: { status: response.status },
          }),
        )
        return
      }
      const meta = (await response.json()) as { id: string }
      router.push(`/project/${meta.id}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : i18n._({
              id: 'app.createProjectButton.failedToCreateProject',
              message: 'Failed to create project',
            }),
      )
    } finally {
      setIsCreating(false)
    }
  }, [router, nextNumber, i18n])

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-destructive text-xs">{error}</span>}
      <button className={PRIMARY_PILL} disabled={isCreating} onClick={handleCreate} type="button">
        <Plus className="h-4 w-4" />
        {isCreating
          ? i18n._({ id: 'app.createProjectButton.creating', message: 'Creating…' })
          : i18n._({ id: 'app.createProjectButton.newProject', message: 'New project' })}
      </button>
    </div>
  )
}
