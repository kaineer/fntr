import { useEffect, useState } from 'react'
import type { ObjectType, RotationAxis } from '../store/objectsSlice.ts'
import {
  addObject,
  closeCommandMenu,
  openSizeForm,
  rotateObjectBy90,
  setMenuLevel,
  toggleSpaceMenu,
  updateObjectColor,
} from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type MenuItem = {
  id: string
  label: string
  color?: string
  onSelect: () => void
}

const OBJECT_COLORS = [
  { id: 'blue', label: 'Blue', value: '#6ea8fe' },
  { id: 'orange', label: 'Orange', value: '#f4a261' },
  { id: 'teal', label: 'Teal', value: '#2a9d8f' },
  { id: 'coral', label: 'Coral', value: '#e76f51' },
  { id: 'yellow', label: 'Yellow', value: '#e9c46a' },
  { id: 'violet', label: 'Violet', value: '#9b5de5' },
  { id: 'white', label: 'White', value: '#e8eaf0' },
] as const

const ROTATE_AXES: { id: RotationAxis; label: string }[] = [
  { id: 'x', label: 'X' },
  { id: 'y', label: 'Y' },
  { id: 'z', label: 'Z' },
]

export function CommandMenu() {
  const dispatch = useAppDispatch()
  const selectedId = useAppSelector((state) => state.objects.selectedId)
  const selectedColor = useAppSelector((state) => {
    const selected = state.objects.items.find(
      (item) => item.id === state.objects.selectedId,
    )
    return selected?.color
  })
  const { open, mode, level } = useAppSelector(
    (state) => state.objects.commandMenu,
  )
  const [pendingAxis, setPendingAxis] = useState<RotationAxis | null>(null)

  const closeMenu = () => {
    setPendingAxis(null)
    dispatch(closeCommandMenu())
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        setPendingAxis(null)
        dispatch(toggleSpaceMenu())
        return
      }

      if (event.code === 'Escape' && open) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setPendingAxis(null)
        dispatch(closeCommandMenu())
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, open])

  const insertObject = (type: ObjectType) => {
    dispatch(addObject(type))
    closeMenu()
  }

  const setColor = (color: string) => {
    if (!selectedId) return
    dispatch(updateObjectColor({ id: selectedId, color }))
    closeMenu()
  }

  const applyRotate = (sign: 1 | -1) => {
    if (!selectedId || !pendingAxis) return
    dispatch(
      rotateObjectBy90({ id: selectedId, axis: pendingAxis, sign }),
    )
    closeMenu()
  }

  const objectActions: MenuItem[] = [
    {
      id: 'size',
      label: 'Size',
      onSelect: () => dispatch(openSizeForm()),
    },
    {
      id: 'color',
      label: 'Color',
      onSelect: () => dispatch(setMenuLevel('color')),
    },
    {
      id: 'rotate',
      label: 'Rotate',
      onSelect: () => dispatch(setMenuLevel('rotate')),
    },
  ]

  const headerLabel =
    level === 'insert'
      ? 'Insert'
      : level === 'color'
        ? 'Color'
        : level === 'rotate'
          ? 'Rotate'
          : level === 'rotateDir'
            ? pendingAxis
              ? `Rotate ${pendingAxis.toUpperCase()}`
              : 'Rotate'
            : null

  const goBack = () => {
    if (level === 'rotateDir') {
      setPendingAxis(null)
      dispatch(setMenuLevel('rotate'))
      return
    }
    if (level === 'rotate') {
      setPendingAxis(null)
    }
    dispatch(setMenuLevel('root'))
  }

  let items: MenuItem[] = []
  if (level === 'root') {
    items =
      mode === 'space'
        ? [
            {
              id: 'insert',
              label: 'Insert',
              onSelect: () => dispatch(setMenuLevel('insert')),
            },
            ...(selectedId ? objectActions : []),
          ]
        : objectActions
  } else if (level === 'insert') {
    items = [
      {
        id: 'cube',
        label: 'Cube',
        onSelect: () => insertObject('cube'),
      },
      {
        id: 'box',
        label: 'Box',
        onSelect: () => insertObject('box'),
      },
      {
        id: 'sphere',
        label: 'Sphere',
        onSelect: () => insertObject('sphere'),
      },
    ]
  } else if (level === 'color') {
    items = OBJECT_COLORS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      color: entry.value,
      onSelect: () => setColor(entry.value),
    }))
  } else if (level === 'rotate') {
    items = ROTATE_AXES.map((axis) => ({
      id: axis.id,
      label: axis.label,
      onSelect: () => {
        setPendingAxis(axis.id)
        dispatch(setMenuLevel('rotateDir'))
      },
    }))
  } else if (level === 'rotateDir') {
    items = [
      {
        id: 'plus90',
        label: '+90°',
        onSelect: () => applyRotate(1),
      },
      {
        id: 'minus90',
        label: '−90°',
        onSelect: () => applyRotate(-1),
      },
    ]
  }

  if (!open) return null

  return (
    <div className="menu-backdrop" onClick={closeMenu}>
      <div
        className="command-menu"
        role="menu"
        aria-label={headerLabel ?? (mode === 'object' ? 'Object' : 'Commands')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-menu-header">
          {headerLabel ? (
            <button
              type="button"
              className="command-menu-back"
              onClick={goBack}
            >
              ← {headerLabel}
            </button>
          ) : (
            <span>{mode === 'object' ? 'Object' : 'Space'}</span>
          )}
        </div>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="menuitem"
                className={
                  item.color && item.color === selectedColor
                    ? 'color-item active'
                    : item.color
                      ? 'color-item'
                      : undefined
                }
                onClick={item.onSelect}
              >
                {item.color ? (
                  <span
                    className="color-swatch"
                    style={{ background: item.color }}
                    aria-hidden
                  />
                ) : null}
                {item.label}
                {level === 'root' || level === 'rotate' ? (
                  <span className="hint">›</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
