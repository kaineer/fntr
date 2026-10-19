import { useState } from 'react'
import {
  addToSelection,
  selectObject,
  type SceneObject,
} from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import styles from './ObjectList.module.css'

const typeLabels = {
  cube: 'Cube',
  sphere: 'Sphere',
} as const

type GroupMode = 'stack' | 'list'

type ListEntry =
  | { kind: 'object'; object: SceneObject }
  | { kind: 'group'; groupId: string; members: SceneObject[] }

function buildEntries(objects: SceneObject[]): ListEntry[] {
  const seenGroups = new Set<string>()
  const entries: ListEntry[] = []

  for (const object of objects) {
    if (!object.groupId) {
      entries.push({ kind: 'object', object })
      continue
    }
    if (seenGroups.has(object.groupId)) continue
    seenGroups.add(object.groupId)
    entries.push({
      kind: 'group',
      groupId: object.groupId,
      members: objects.filter((entry) => entry.groupId === object.groupId),
    })
  }

  return entries
}

function objectSummary(object: SceneObject) {
  return (
    <>
      <strong>{typeLabels[object.type]}</strong>
      <span>
        size {object.size.x}×{object.size.y}×{object.size.z}
      </span>
      <span>
        pos {object.position.x.toFixed(1)}, {object.position.y.toFixed(1)},{' '}
        {object.position.z.toFixed(1)}
      </span>
    </>
  )
}

function groupSummary(members: SceneObject[]) {
  const types = members.map((member) => typeLabels[member.type]).join(', ')
  return (
    <>
      <strong>
        Group · {members.length}
      </strong>
      <span>{types}</span>
    </>
  )
}

export const ObjectList = () => {
  const dispatch = useAppDispatch()
  const objects = useAppSelector((state) => state.objects.items)
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
  const [groupModes, setGroupModes] = useState<Record<string, GroupMode>>({})

  const entries = buildEntries(objects)

  const select = (id: string, shiftKey: boolean) => {
    if (shiftKey && selectedIds.length > 0) {
      dispatch(addToSelection(id))
      return
    }
    dispatch(selectObject({ id }))
  }

  const toggleMode = (groupId: string) => {
    setGroupModes((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === 'list' ? 'stack' : 'list',
    }))
  }

  if (objects.length === 0) {
    return <p className="empty">Сцена пуста</p>
  }

  return (
    <ul className={styles.list}>
      {entries.map((entry) => {
        if (entry.kind === 'object') {
          const { object } = entry
          return (
            <li key={object.id}>
              <button
                type="button"
                className={
                  selectedIds.includes(object.id)
                    ? `${styles.item} ${styles.selected}`
                    : styles.item
                }
                onClick={(event) => select(object.id, event.shiftKey)}
              >
                {objectSummary(object)}
              </button>
            </li>
          )
        }

        const { groupId, members } = entry
        const mode = groupModes[groupId] ?? 'stack'
        const groupSelected = members.every((member) =>
          selectedIds.includes(member.id),
        )
        const primaryId = members[0]!.id

        return (
          <li key={groupId} className={styles.group}>
            <div className={mode === 'stack' ? styles.stack : undefined}>
              <div className={styles.groupHeader}>
                <button
                  type="button"
                  className={
                    groupSelected
                      ? `${styles.groupMain} ${styles.selected}`
                      : styles.groupMain
                  }
                  onClick={(event) => select(primaryId, event.shiftKey)}
                >
                  {groupSummary(members)}
                </button>
                <button
                  type="button"
                  className={styles.modeToggle}
                  aria-label={
                    mode === 'stack'
                      ? 'Показать список объектов группы'
                      : 'Свернуть группу в стопку'
                  }
                  title={mode === 'stack' ? 'Список' : 'Стопка'}
                  onClick={() => toggleMode(groupId)}
                >
                  {mode === 'stack' ? '≡' : '▾'}
                </button>
              </div>
            </div>

            {mode === 'list' ? (
              <ul className={styles.members}>
                {members.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      className={
                        selectedIds.includes(member.id)
                          ? `${styles.member} ${styles.selected}`
                          : styles.member
                      }
                      onClick={(event) => select(member.id, event.shiftKey)}
                    >
                      {objectSummary(member)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
