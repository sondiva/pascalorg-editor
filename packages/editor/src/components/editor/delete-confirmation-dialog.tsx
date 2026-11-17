'use client'

import {
  type AnyNode,
  type DeleteZonePayload,
  defaultI18n,
  type PascalI18n,
  type StructureNodes,
  usePascalI18n,
  useScene,
} from '@pascal-app/core'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '../../lib/utils'
import useDeleteConfirmation, {
  type DeleteConfirmationRequest,
  type RoomConstructionChange,
} from '../../store/use-delete-confirmation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/primitives/dialog'

/**
 * `{n, plural, ...}` counts, one message per noun: English pluralises with
 * "s" and Vietnamese does not, so the noun lives inside the plural branch
 * instead of being glued onto a count.
 */
const countWalls = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.walls',
    message: '{n, plural, one {# wall} other {# walls}}',
    values: { n },
  })
const countSeparators = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.separators',
    message: '{n, plural, one {# separator} other {# separators}}',
    values: { n },
  })
const countDoors = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.doors',
    message: '{n, plural, one {# door} other {# doors}}',
    values: { n },
  })
const countWindows = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.windows',
    message: '{n, plural, one {# window} other {# windows}}',
    values: { n },
  })
const countItems = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.items',
    message: '{n, plural, one {# item} other {# items}}',
    values: { n },
  })
const countLights = (i18n: PascalI18n, n: number) =>
  i18n._({
    id: 'editor.deleteConfirmationDialog.lights',
    message: '{n, plural, one {# light} other {# lights}}',
    values: { n },
  })

function sentenceList(i18n: PascalI18n, parts: string[]) {
  if (parts.length <= 1) return parts.join('')
  const and = i18n._({ id: 'editor.deleteConfirmationDialog.and', message: 'and' })
  return `${parts.slice(0, -1).join(', ')} ${and} ${parts.at(-1)}`
}

/**
 * A mezzanine takes its own plate (with its railing) and the ceiling core
 * derived over it; kept items come down to the floor below.
 */
function mezzanineDeletionDescription(
  i18n: PascalI18n,
  room: DeleteZonePayload,
  nodes: StructureNodes,
) {
  const hasCeiling = Object.values(nodes).some(
    (node) => node.type === 'ceiling' && node.zoneId === room.zoneId,
  )
  const sentences = [
    hasCeiling
      ? i18n._({
          id: 'editor.deleteConfirmationDialog.mezzanineRemovesWithCeiling',
          message: 'Removes the mezzanine floor, its railing and the ceiling over it.',
        })
      : i18n._({
          id: 'editor.deleteConfirmationDialog.mezzanineRemoves',
          message: 'Removes the mezzanine floor and its railing.',
        }),
  ]
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.mezzanineItems',
        message:
          '{items, plural, one {# item is on it. Keep it on the floor below, or delete it too.} other {# items are on it. Keep them on the floor below, or delete them too.}}',
        values: { items },
      }),
    )
  return sentences.join(' ')
}

/**
 * An area Divide made goes back into the room across its dividing line: the
 * line and the area's own finish go, the walls and anything standing in it stay.
 */
function mergeDescription(i18n: PascalI18n, room: DeleteZonePayload, nodes: StructureNodes) {
  const into = nodes[room.mergedIntoZoneId ?? '']?.name?.trim()
  const sentences = [
    i18n._({
      id: 'editor.deleteConfirmationDialog.mergeBack',
      message:
        '{count, plural, one {Merges it back into {into}: removes the dividing line and its floor finish. The walls stay.} other {Merges it back into {into}: removes the dividing lines and its floor finish. The walls stay.}}',
      values: {
        count: room.separatorIds.length,
        into:
          into ||
          i18n._({
            id: 'editor.deleteConfirmationDialog.roomNextToIt',
            message: 'the room next to it',
          }),
      },
    }),
  ]
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.mergeItems',
        message:
          '{items, plural, one {# item inside stays where it is.} other {# items inside stay where they are.}}',
        values: { items },
      }),
    )
  return sentences.join(' ')
}

function roomDeletionDescription(i18n: PascalI18n, room: DeleteZonePayload, nodes: StructureNodes) {
  if (isMezzanine(room, nodes)) return mezzanineDeletionDescription(i18n, room, nodes)
  if (room.mode === 'merge') return mergeDescription(i18n, room, nodes)
  const sentences: string[] = []
  const typeCount = (type: string) =>
    room.openingIds.filter((id) => nodes[id]?.type === type).length
  const removed = [
    room.wallIds.length ? countWalls(i18n, room.wallIds.length) : '',
    room.separatorIds.length ? countSeparators(i18n, room.separatorIds.length) : '',
    typeCount('door') ? countDoors(i18n, typeCount('door')) : '',
    typeCount('window') ? countWindows(i18n, typeCount('window')) : '',
  ].filter(Boolean)
  sentences.push(
    removed.length
      ? i18n._({
          id: 'editor.deleteConfirmationDialog.removesWithFinish',
          message: 'Removes {removed}, with the floor finish and ceiling.',
          values: { removed: sentenceList(i18n, removed) },
        })
      : i18n._({
          id: 'editor.deleteConfirmationDialog.removesFinishOnly',
          message: 'Removes the floor finish and ceiling.',
        }),
  )
  if (room.keptSharedWallIds.length + room.keptSharedSeparatorIds.length > 0)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.sharedWallsStay',
        message: 'Walls shared with other rooms stay.',
      }),
    )
  if (room.opensZoneIds.length) {
    const names = room.opensZoneIds.map(
      (id) =>
        nodes[id]?.name?.trim() ||
        i18n._({ id: 'editor.deleteConfirmationDialog.nextRoom', message: 'the next room' }),
    )
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.opensInto',
        message: 'Opens into {names}.',
        values: { names: sentenceList(i18n, names) },
      }),
    )
  }
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.roomItems',
        message:
          '{items, plural, one {# item is inside. Keep it where it is, or delete it too.} other {# items are inside. Keep them where they are, or delete them too.}}',
        values: { items },
      }),
    )
  return sentences.join(' ')
}

/** A hosted node's kind from its type and structure — never from its name. */
function hostedKind(node: AnyNode | undefined) {
  if (node?.type === 'door' || node?.type === 'window') return node.type
  if (node?.type === 'item' && node.asset.interactive?.effects.some((e) => e.kind === 'light'))
    return 'light'
  return 'item'
}

function hostedName(node: AnyNode | undefined) {
  return (node?.name || (node?.type === 'item' ? node.asset.name : '') || '').trim()
}

function shownNames(names: string[]) {
  const named = [...new Set(names.filter(Boolean))]
  return named.slice(0, 3).join(', ') + (named.length > 3 ? ', …' : '')
}

/** "1 door (Front door), 2 windows and 1 light": counts per kind, a few names, no ids. */
export function hostedSummary(i18n: PascalI18n, ids: readonly string[], nodes: StructureNodes) {
  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const kind = hostedKind(nodes[id])
    groups.set(kind, [...(groups.get(kind) ?? []), hostedName(nodes[id])])
  }
  const countKind = (kind: string, n: number) =>
    kind === 'door'
      ? countDoors(i18n, n)
      : kind === 'window'
        ? countWindows(i18n, n)
        : kind === 'light'
          ? countLights(i18n, n)
          : countItems(i18n, n)
  return sentenceList(
    i18n,
    [...groups].map(([kind, names]) => {
      const shown = shownNames(names)
      return `${countKind(kind, names.length)}${shown ? ` (${shown})` : ''}`
    }),
  )
}

function ceilingContent(
  i18n: PascalI18n,
  change: RoomConstructionChange,
  nodes: StructureNodes,
  room: string,
  canKeep: boolean,
): DeleteConfirmationContent {
  const ids = change.hostedIds
  const manual = change.manualCeilings ?? []
  const sentences: string[] = []
  if (manual.length) {
    const names = shownNames(manual)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.manualCeilings',
        message:
          '{count, plural, one {Removes the hand-drawn ceiling{names}.} other {Removes # hand-drawn ceilings{names}.}}',
        values: { count: manual.length, names: names ? ` (${names})` : '' },
      }),
    )
    if (change.alsoCovers?.length)
      sentences.push(
        i18n._({
          id: 'editor.deleteConfirmationDialog.alsoCovers',
          message:
            '{count, plural, one {It also covers {rooms}.} other {They also cover {rooms}.}}',
          values: { count: manual.length, rooms: sentenceList(i18n, change.alsoCovers) },
        }),
      )
  }
  // Lights are known from their light effect; anything else reads as an item.
  const lights = ids.length > 0 && ids.every((id) => hostedKind(nodes[id]) === 'light')
  if (ids.length) {
    const names = shownNames(ids.map((id) => hostedName(nodes[id])))
    sentences.push(
      lights
        ? i18n._({
            id: 'editor.deleteConfirmationDialog.lightsHang',
            message:
              '{count, plural, one {{summary} hangs from it.} other {{summary} hang from it.}}',
            values: { count: ids.length, summary: hostedSummary(i18n, ids, nodes) },
          })
        : i18n._({
            id: 'editor.deleteConfirmationDialog.itemsOnCeiling',
            message:
              '{count, plural, one {# item is on the ceiling{names}.} other {# items are on the ceiling{names}.}}',
            values: { count: ids.length, names: names ? ` (${names})` : '' },
          }),
      i18n._({
        id: 'editor.deleteConfirmationDialog.keepInPlace',
        message:
          '{count, plural, one {Keep it in place, or delete it too.} other {Keep them in place, or delete them too.}}',
        values: { count: ids.length },
      }),
    )
  }
  return {
    title: i18n._({
      id: 'editor.deleteConfirmationDialog.ceilingTitle',
      message: 'Remove the ceiling from {room}?',
      values: { room },
    }),
    description: sentences.length
      ? sentences.join(' ')
      : i18n._({
          id: 'editor.deleteConfirmationDialog.removesCeiling',
          message: 'Removes the ceiling.',
        }),
    keepLabel:
      ids.length && canKeep
        ? lights
          ? i18n._({ id: 'editor.deleteConfirmationDialog.keepLights', message: 'Keep lights' })
          : i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
        : null,
    confirmLabel: ids.length
      ? i18n._({ id: 'editor.deleteConfirmationDialog.removeAll', message: 'Remove all' })
      : i18n._({ id: 'editor.deleteConfirmationDialog.remove', message: 'Remove' }),
    destructive: true,
  }
}

function constructionContent(
  i18n: PascalI18n,
  change: RoomConstructionChange,
  nodes: StructureNodes,
  canKeep: boolean,
): DeleteConfirmationContent {
  const room = change.roomName.trim() || 'this room'
  const hosted = hostedSummary(i18n, change.hostedIds, nodes)
  if (change.part === 'walls' && change.action === 'add') {
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.addWallsTitle',
        message: 'Add walls to {room}?',
        values: { room },
      }),
      description: i18n._({
        id: 'editor.deleteConfirmationDialog.addWallsDescription',
        message: 'Adds {walls} · the room loses {area} m² of floor.',
        values: {
          walls: countWalls(i18n, change.wallCount ?? 0),
          area: (change.areaLoss ?? 0).toFixed(2),
        },
      }),
      keepLabel: null,
      confirmLabel: i18n._({
        id: 'editor.deleteConfirmationDialog.addWalls',
        message: 'Add walls',
      }),
      destructive: false,
    }
  }
  if (change.part === 'walls') {
    const walls = countWalls(i18n, change.wallCount ?? 0)
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.removeWallsTitle',
        message: 'Remove walls from {room}?',
        values: { room },
      }),
      description: [
        hosted
          ? i18n._({
              id: 'editor.deleteConfirmationDialog.turnsIntoSeparatorsRemoves',
              message: 'Turns {walls} into separators and removes {hosted}.',
              values: { walls, hosted },
            })
          : i18n._({
              id: 'editor.deleteConfirmationDialog.turnsIntoSeparators',
              message: 'Turns {walls} into separators.',
              values: { walls },
            }),
        change.sharedWalls
          ? i18n._({
              id: 'editor.deleteConfirmationDialog.sharedWallsRemain',
              message: 'Shared walls remain.',
            })
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      keepLabel: null,
      confirmLabel: i18n._({
        id: 'editor.deleteConfirmationDialog.removeWalls',
        message: 'Remove walls',
      }),
      destructive: true,
    }
  }
  if (change.part === 'floor') {
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.removeFloorTitle',
        message: 'Remove the floor from {room}?',
        values: { room },
      }),
      description: hosted
        ? i18n._({
            id: 'editor.deleteConfirmationDialog.floorItems',
            message:
              '{count, plural, one {{hosted} stands on it. Keep it at its height, or delete it too.} other {{hosted} stand on it. Keep them at their height, or delete them too.}}',
            values: { count: change.hostedIds.length, hosted },
          })
        : i18n._({
            id: 'editor.deleteConfirmationDialog.removesFloor',
            message: 'Removes the floor.',
          }),
      keepLabel:
        hosted && canKeep
          ? i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
          : null,
      confirmLabel: hosted
        ? i18n._({ id: 'editor.deleteConfirmationDialog.deleteItems', message: 'Delete items' })
        : i18n._({ id: 'editor.deleteConfirmationDialog.remove', message: 'Remove' }),
      destructive: true,
    }
  }
  return ceilingContent(i18n, change, nodes, room, canKeep)
}

export type DeleteConfirmationContent = {
  title: string
  description: string
  /** Delete the room but leave its items in place — offered only when it has items. */
  keepLabel: string | null
  confirmLabel: string
  /** Red confirm for removals; adding walls confirms in the neutral style. */
  destructive: boolean
}

/** The words and choices the confirmation offers, from the request alone. */
function isMezzanine(room: DeleteZonePayload, nodes: StructureNodes) {
  const zone = nodes[room.zoneId]
  return zone?.type === 'zone' && zone.floor?.support === 'open'
}

export function deleteConfirmationContent(
  request: DeleteConfirmationRequest,
  nodes: StructureNodes,
  i18n: PascalI18n = defaultI18n,
): DeleteConfirmationContent {
  if (request.construction)
    return constructionContent(i18n, request.construction, nodes, !!request.onKeepContents)
  const room = request.room
  if (!room)
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.deleteElements',
        message: '{count, plural, one {Delete # element?} other {Delete # elements?}}',
        values: { count: request.count },
      }),
      description: i18n._({
        id: 'editor.deleteConfirmationDialog.deleteElementsDescription',
        message:
          'This removes every selected element. You can undo the deletion while it remains in the editor history.',
      }),
      keepLabel: null,
      confirmLabel: i18n._({ id: 'editor.deleteConfirmationDialog.delete', message: 'Delete' }),
      destructive: true,
    }
  const merge = room.mode === 'merge'
  // A merged area's items always stay, so there is nothing to choose.
  const hasItems = room.itemIds.length > 0 && !merge
  return {
    title: i18n._({
      id: 'editor.deleteConfirmationDialog.deleteRoom',
      message: 'Delete {name}?',
      values: {
        name:
          room.name.trim() ||
          i18n._(
            isMezzanine(room, nodes)
              ? { id: 'editor.deleteConfirmationDialog.thisMezzanine', message: 'this mezzanine' }
              : merge
                ? { id: 'editor.deleteConfirmationDialog.thisArea', message: 'this area' }
                : { id: 'editor.deleteConfirmationDialog.thisRoom', message: 'this room' },
          ),
      },
    }),
    description: roomDeletionDescription(i18n, room, nodes),
    keepLabel:
      hasItems && request.onKeepContents
        ? i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
        : null,
    confirmLabel: hasItems
      ? i18n._({ id: 'editor.deleteConfirmationDialog.deleteAll', message: 'Delete all' })
      : i18n._({ id: 'editor.deleteConfirmationDialog.delete', message: 'Delete' }),
    destructive: true,
  }
}

export function DeleteConfirmationDialog() {
  const i18n = usePascalI18n()
  const request = useDeleteConfirmation((state) => state.request)
  const cancel = useDeleteConfirmation((state) => state.cancel)
  const confirm = useDeleteConfirmation((state) => state.confirm)
  const nodes = useScene((state) => (request ? state.nodes : null))
  const live = useMemo(
    () => (request && nodes ? deleteConfirmationContent(request, nodes, i18n) : null),
    [request, nodes, i18n],
  )
  // Hold the last words through the close animation so the dialog never empties.
  const shown = useRef(live)
  if (live) shown.current = live
  const content = shown.current
  const blocked = !!request?.conflict

  useEffect(() => cancel, [cancel])

  return (
    <Dialog onOpenChange={(open) => !open && cancel()} open={request !== null}>
      <DialogContent
        className="border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-md"
        data-delete-confirmation-dialog
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{content?.title}</DialogTitle>
          <DialogDescription>
            {content?.description}
            {request?.conflict && (
              <span className="mt-2 block text-destructive">{request.conflict}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
            onClick={cancel}
            type="button"
          >
            {i18n._({ id: 'editor.deleteConfirmationDialog.cancel', message: 'Cancel' })}
          </button>
          {content?.keepLabel && (
            <button
              className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              disabled={blocked}
              onClick={() => {
                const keep = request?.onKeepContents
                cancel()
                keep?.()
              }}
              type="button"
            >
              {content.keepLabel}
            </button>
          )}
          <button
            className={cn(
              'rounded-full px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50',
              content?.destructive === false
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-red-600 text-white hover:bg-red-700',
            )}
            disabled={blocked}
            onClick={confirm}
            type="button"
          >
            {content?.confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
