import { useEffect } from 'react'
import type { CornerId, DragPlane, ObjectType } from '../store/objectsSlice.ts'
import {
  addObject,
  alignObjectCorners,
  clearAlign,
  closeCommandMenu,
  openRotateForm,
  openSizeForm,
  setMenuLevel,
  startAlign,
  startDrag,
  startRotateEdit,
  startSizeEdit,
  toggleSpaceMenu,
  updateObjectColor,
} from '../store/objectsSlice.ts'
import { CORNERS } from '../store/corners.ts'
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

const MOVE_PLANES: { id: DragPlane; label: string }[] = [
  { id: 'xy', label: 'XY' },
  { id: 'xz', label: 'XZ' },
  { id: 'yz', label: 'YZ' },
]

export function CommandMenu() {
  const dispatch = useAppDispatch()
  const selectedId = useAppSelector((state) => state.objects.selectedId)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selectedColor = useAppSelector((state) => {
    const selected = state.objects.items.find(
      (item) => item.id === state.objects.selectedId,
    )
    return selected?.color
  })
  const { open, mode, level } = useAppSelector(
    (state) => state.objects.commandMenu,
  )

  const closeMenu = () => {
    if (align?.phase === 'pickTargetCorner') {
      dispatch(clearAlign())
    }
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
        if (sizeEdit) {
          if (!sizeEdit.formOpen) {
            dispatch(openSizeForm())
          }
          return
        }
        if (rotateEdit) {
          if (!rotateEdit.formOpen) {
            dispatch(openRotateForm())
          }
          return
        }
        dispatch(toggleSpaceMenu())
        return
      }

      if (event.code === 'Escape' && open) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (align?.phase === 'pickTargetCorner') {
          dispatch(clearAlign())
        }
        dispatch(closeCommandMenu())
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, open, align, sizeEdit, rotateEdit])

  const insertObject = (type: ObjectType) => {
    dispatch(addObject(type))
    closeMenu()
  }

  const setColor = (color: string) => {
    if (!selectedId) return
    dispatch(updateObjectColor({ id: selectedId, color }))
    closeMenu()
  }

  const applyAlignTarget = (targetCorner: CornerId) => {
    if (!selectedId || align?.phase !== 'pickTargetCorner') return
    dispatch(
      alignObjectCorners({
        id: selectedId,
        sourceCorner: align.sourceCorner,
        targetId: align.targetId,
        targetCorner,
      }),
    )
  }

  const objectActions: MenuItem[] = [
    {
      id: 'size',
      label: 'Size',
      onSelect: () => dispatch(startSizeEdit()),
    },
    {
      id: 'color',
      label: 'Color',
      onSelect: () => dispatch(setMenuLevel('color')),
    },
    {
      id: 'rotate',
      label: 'Rotate',
      onSelect: () => dispatch(startRotateEdit()),
    },
    {
      id: 'move',
      label: 'Move',
      onSelect: () => dispatch(setMenuLevel('move')),
    },
    {
      id: 'align',
      label: 'Align',
      onSelect: () => dispatch(setMenuLevel('align')),
    },
  ]

  const headerLabel =
    level === 'insert'
      ? 'Insert'
      : level === 'color'
        ? 'Color'
        : level === 'move'
          ? 'Move'
          : level === 'align'
            ? 'Align'
            : level === 'alignTarget'
              ? 'Align to'
              : null

  const goBack = () => {
    if (level === 'alignTarget') {
      dispatch(clearAlign())
      dispatch(closeCommandMenu())
      return
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
      { id: 'cube', label: 'Cube', onSelect: () => insertObject('cube') },
      { id: 'box', label: 'Box', onSelect: () => insertObject('box') },
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
  } else if (level === 'move') {
    items = MOVE_PLANES.map((plane) => ({
      id: plane.id,
      label: plane.label,
      onSelect: () => dispatch(startDrag(plane.id)),
    }))
  } else if (level === 'align') {
    items = CORNERS.map((corner) => ({
      id: corner.id,
      label: corner.label,
      onSelect: () => dispatch(startAlign(corner.id)),
    }))
  } else if (level === 'alignTarget') {
    items = CORNERS.map((corner) => ({
      id: corner.id,
      label: corner.label,
      onSelect: () => applyAlignTarget(corner.id),
    }))
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
                {level === 'root' ? <span className="hint">›</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
