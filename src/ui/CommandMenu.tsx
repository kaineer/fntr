import { useEffect, useRef } from 'react'
import type { MenuLevel, ObjectType } from '../store/objectsSlice.ts'
import {
  addObject,
  closeCommandMenu,
  cutSelected,
  groupSelected,
  importScene,
  loadScene,
  openInsertMenu,
  openRotateForm,
  openSizeForm,
  pasteClipboard,
  setMenuLevel,
  startAlign,
  startMoveEdit,
  startRotateEdit,
  startSizeEdit,
  toggleSpaceMenu,
  ungroupSelected,
  updateSelectedColor,
  yankSelected,
} from '../store/objectsSlice.ts'
import {
  downloadSceneYaml,
  objectsForImport,
  objectsForLoad,
  pickSceneYamlFile,
} from '../io/sceneFile.ts'
import { isGroupSelection, primarySelectedId } from '../store/selection.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type MenuItem = {
  id: string
  label: string
  color?: string
  /** Explicit hotkey; skips first-letter assignment when set. */
  hotkey?: string
  onSelect: () => void
}

const OBJECT_COLORS = [
  { id: 'white', label: 'White', value: '#f5f5f2' },
  { id: 'light-gray', label: 'Light gray', value: '#c8c8c4' },
  { id: 'dark-gray', label: 'Dark gray', value: '#5a5a58' },
  { id: 'black', label: 'Black', value: '#1a1a1a' },
  { id: 'light-brown', label: 'Light brown', value: '#c4a574' },
  { id: 'brown', label: 'Brown', value: '#6b4a2e' },
] as const

const MENU_LEVEL_LABELS: Partial<Record<MenuLevel, string>> = {
  insert: 'Insert',
  file: 'File',
  color: 'Color',
}

/**
 * Assign first-letter hotkeys while letters stay unique.
 * Items with an explicit `hotkey` keep it; that letter is reserved.
 */
function withFirstLetterHotkeys(items: MenuItem[]): MenuItem[] {
  const reserved = new Set(
    items
      .map((item) => item.hotkey?.toLowerCase())
      .filter((letter): letter is string => Boolean(letter)),
  )
  const letters = items.map((item) => {
    if (item.hotkey) return ''
    const ch = item.label[0]
    return ch ? ch.toLowerCase() : ''
  })
  const counts = new Map<string, number>()
  for (const letter of letters) {
    if (!letter) continue
    counts.set(letter, (counts.get(letter) ?? 0) + 1)
  }
  return items.map((item, index) => {
    if (item.hotkey) return { ...item, hotkey: item.hotkey.toLowerCase() }
    const letter = letters[index]
    if (!letter || reserved.has(letter) || counts.get(letter) !== 1) {
      return item
    }
    return { ...item, hotkey: letter }
  })
}

export function CommandMenu() {
  const dispatch = useAppDispatch()
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
  const items = useAppSelector((state) => state.objects.items)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selectedId = primarySelectedId(selectedIds)
  const selectedItem = items.find((item) => item.id === selectedId)
  const isCube = selectedItem?.type === 'cube'
  const multi = selectedIds.length > 1
  const groupSelectedActive = isGroupSelection(items, selectedIds)
  const selectedColor = selectedItem?.color
  const { open, mode, level } = useAppSelector(
    (state) => state.objects.commandMenu,
  )

  const closeMenu = () => {
    dispatch(closeCommandMenu())
  }

  const moveEdit = useAppSelector((state) => state.objects.moveEdit)
  const clipboard = useAppSelector((state) => state.objects.clipboard)

  const insertObject = (type: ObjectType) => {
    dispatch(addObject(type))
    closeMenu()
  }

  const setColor = (color: string) => {
    if (selectedIds.length === 0) return
    dispatch(updateSelectedColor(color))
    closeMenu()
  }

  const saveScene = () => {
    if (items.length === 0) return
    downloadSceneYaml(items)
    closeMenu()
  }

  const loadFromFile = () => {
    void pickSceneYamlFile().then((file) => {
      if (!file) return
      dispatch(loadScene(objectsForLoad(file)))
      closeMenu()
    })
  }

  const importFromFile = () => {
    void pickSceneYamlFile().then((file) => {
      if (!file) return
      dispatch(importScene(objectsForImport(file, items)))
      closeMenu()
    })
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
      onSelect: () => dispatch(startMoveEdit()),
    },
    ...(!multi && isCube
      ? [
          {
            id: 'align',
            label: 'Align',
            onSelect: () => dispatch(startAlign()),
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
      hotkey: 'x',
      onSelect: () => {
        dispatch(cutSelected())
        closeMenu()
      },
    },
  ]

  const headerLabel = MENU_LEVEL_LABELS[level] ?? null

  const goBack = () => {
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
            {
              id: 'file',
              label: 'File',
              onSelect: () => dispatch(setMenuLevel('file')),
            },
            ...(selectedId ? objectActions : []),
          ]
        : objectActions
  } else if (level === 'insert') {
    menuItems = [
      { id: 'cube', label: 'Cube', onSelect: () => insertObject('cube') },
      {
        id: 'sphere',
        label: 'Sphere',
        onSelect: () => insertObject('sphere'),
      },
    ]
  } else if (level === 'file') {
    menuItems = [
      ...(items.length > 0
        ? [{ id: 'save', label: 'Save', onSelect: saveScene }]
        : []),
      { id: 'load', label: 'Load', onSelect: loadFromFile },
      { id: 'import', label: 'Import', onSelect: importFromFile },
    ]
  } else if (level === 'color') {
    menuItems = OBJECT_COLORS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      color: entry.value,
      onSelect: () => setColor(entry.value),
    }))
  }

  menuItems = withFirstLetterHotkeys(menuItems)
  const menuItemsRef = useRef(menuItems)
  menuItemsRef.current = menuItems

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
        dispatch(closeCommandMenu())
        return
      }

      const busy =
        Boolean(sizeEdit) ||
        Boolean(rotateEdit) ||
        Boolean(moveEdit) ||
        Boolean(align)
      if (busy || event.metaKey || event.ctrlKey || event.altKey) return

      if (open) {
        const letter = event.key.length === 1 ? event.key.toLowerCase() : ''
        if (letter) {
          const match = menuItemsRef.current.find(
            (item) => item.hotkey === letter,
          )
          if (match) {
            event.preventDefault()
            event.stopImmediatePropagation()
            match.onSelect()
          }
        }
        return
      }

      if (event.code === 'KeyI') {
        event.preventDefault()
        dispatch(openInsertMenu())
        return
      }

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
    moveEdit,
    selectedIds,
    clipboard,
    groupSelectedActive,
  ])

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
                {item.hotkey ? (
                  <span className="hint">{item.hotkey.toUpperCase()}</span>
                ) : level === 'root' ? (
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
