import { useEffect } from 'react'
import type { CornerId, DragPlane, ObjectType } from '../store/objectsSlice.ts'
import {
  addObject,
  alignObjectCorners,
  clearAlign,
  closeCommandMenu,
  cutSelected,
  groupSelected,
  openRotateForm,
  openSizeForm,
  pasteClipboard,
  setMenuLevel,
  startAlign,
  startDrag,
  startRotateEdit,
  startSizeEdit,
  toggleSpaceMenu,
  ungroupSelected,
  updateSelectedColor,
  yankSelected,
} from '../store/objectsSlice.ts'
import { isGroupSelection, primarySelectedId } from '../store/selection.ts'
import { CORNERS } from '../store/corners.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type MenuItem = {
  id: string
  label: string
  color?: string
  onSelect: () => void
}

const OBJECT_COLORS = [
  { id: 'white', label: 'White', value: '#f5f5f2' },
  { id: 'light-gray', label: 'Light gray', value: '#c8c8c4' },
  { id: 'dark-gray', label: 'Dark gray', value: '#5a5a58' },
  { id: 'black', label: 'Black', value: '#1a1a1a' },
  { id: 'brown', label: 'Brown', value: '#6b4a2e' },
] as const

const MOVE_PLANES: { id: DragPlane; label: string }[] = [
  { id: 'xy', label: 'XY' },
  { id: 'xz', label: 'XZ' },
  { id: 'yz', label: 'YZ' },
]

export function CommandMenu() {
  const dispatch = useAppDispatch()
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
  const items = useAppSelector((state) => state.objects.items)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selectedId = primarySelectedId(selectedIds)
  const multi = selectedIds.length > 1
  const groupSelectedActive = isGroupSelection(items, selectedIds)
  const selectedColor = useAppSelector((state) => {
    const primary = primarySelectedId(state.objects.selectedIds)
    const selected = state.objects.items.find((item) => item.id === primary)
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

  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const clipboard = useAppSelector((state) => state.objects.clipboard)

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
        return
      }

      const busy =
        Boolean(sizeEdit) ||
        Boolean(rotateEdit) ||
        Boolean(dragPlane) ||
        Boolean(align)
      if (busy || event.metaKey || event.ctrlKey || event.altKey) return

      if (event.code === 'KeyG') {
        if (event.shiftKey) {
          if (!groupSelectedActive) return
          event.preventDefault()
          dispatch(ungroupSelected())
          return
        }
        if (selectedIds.length < 2) return
        event.preventDefault()
        dispatch(groupSelected())
        return
      }

      if (event.code === 'KeyX') {
        if (selectedIds.length === 0) return
        event.preventDefault()
        dispatch(cutSelected())
        return
      }

      if (event.code === 'KeyY') {
        if (selectedIds.length === 0) return
        event.preventDefault()
        dispatch(yankSelected())
        return
      }

      if (event.code === 'KeyP') {
        if (!clipboard) return
        event.preventDefault()
        dispatch(pasteClipboard())
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    dispatch,
    open,
    align,
    sizeEdit,
    rotateEdit,
    dragPlane,
    selectedIds,
    clipboard,
    groupSelectedActive,
  ])

  const insertObject = (type: ObjectType) => {
    dispatch(addObject(type))
    closeMenu()
  }

  const setColor = (color: string) => {
    if (selectedIds.length === 0) return
    dispatch(updateSelectedColor(color))
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
    ...(!multi
      ? [
          {
            id: 'size',
            label: 'Size',
            onSelect: () => dispatch(startSizeEdit()),
          },
        ]
      : []),
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
    ...(!multi
      ? [
          {
            id: 'align',
            label: 'Align',
            onSelect: () => dispatch(setMenuLevel('align')),
          },
        ]
      : []),
    ...(multi && !groupSelectedActive
      ? [
          {
            id: 'group',
            label: 'Group',
            onSelect: () => {
              dispatch(groupSelected())
              closeMenu()
            },
          },
        ]
      : []),
    ...(groupSelectedActive
      ? [
          {
            id: 'ungroup',
            label: 'Ungroup',
            onSelect: () => {
              dispatch(ungroupSelected())
              closeMenu()
            },
          },
        ]
      : []),
    {
      id: 'delete',
      label: 'Delete',
      onSelect: () => {
        dispatch(cutSelected())
        closeMenu()
      },
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

  let menuItems: MenuItem[] = []
  if (level === 'root') {
    menuItems =
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
    menuItems = [
      { id: 'cube', label: 'Cube', onSelect: () => insertObject('cube') },
      { id: 'box', label: 'Box', onSelect: () => insertObject('box') },
      {
        id: 'sphere',
        label: 'Sphere',
        onSelect: () => insertObject('sphere'),
      },
    ]
  } else if (level === 'color') {
    menuItems = OBJECT_COLORS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      color: entry.value,
      onSelect: () => setColor(entry.value),
    }))
  } else if (level === 'move') {
    menuItems = MOVE_PLANES.map((plane) => ({
      id: plane.id,
      label: plane.label,
      onSelect: () => dispatch(startDrag(plane.id)),
    }))
  } else if (level === 'align') {
    menuItems = CORNERS.map((corner) => ({
      id: corner.id,
      label: corner.label,
      onSelect: () => dispatch(startAlign(corner.id)),
    }))
  } else if (level === 'alignTarget') {
    menuItems = CORNERS.map((corner) => ({
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
            <span>
              {mode === 'object'
                ? multi
                  ? `Objects (${selectedIds.length})`
                  : 'Object'
                : 'Space'}
            </span>
          )}
        </div>
        <ul>
          {menuItems.map((item) => (
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
