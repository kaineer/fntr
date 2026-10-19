import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'
import { positionToMatchCorners, type CornerId } from './corners.ts'
import { pasteGroupDeltaX } from './pasteOffset.ts'
import {
  edgeWorldPivotAndAxis,
  rotateAroundWorldAxis,
} from './rotateAroundEdge.ts'
import {
  expandWithGroup,
  isGroupSelection,
  primarySelectedId,
} from './selection.ts'
import { DEFAULT_SIZE_EDGE, type SizeEdge } from './sizeEdge.ts'

export type ObjectType = 'cube' | 'box' | 'sphere'

export type Vec3 = {
  x: number
  y: number
  z: number
}

export type SceneObject = {
  id: string
  type: ObjectType
  size: Vec3
  rotation: Vec3
  position: Vec3
  color: string
  groupId: string | null
}

/** Object payload without id — used by yank / cut / paste. */
export type ClipboardObject = Omit<SceneObject, 'id' | 'groupId'>

export type ClipboardState = {
  objects: ClipboardObject[]
  asGroup: boolean
}

export const DEFAULT_OBJECT_COLOR = '#f5f5f2'

function cloneClipboardObject(
  item: SceneObject | ClipboardObject,
): ClipboardObject {
  return {
    type: item.type,
    size: { ...item.size },
    rotation: { ...item.rotation },
    position: { ...item.position },
    color: item.color,
  }
}

function clearSelectionModes(state: ObjectsState) {
  state.sizeEdit = null
  state.rotateEdit = null
  state.dragPlane = null
  state.align = null
  state.commandMenu = closedMenu
}

function dissolveSingletonGroups(state: ObjectsState) {
  const counts = new Map<string, number>()
  for (const item of state.items) {
    if (!item.groupId) continue
    counts.set(item.groupId, (counts.get(item.groupId) ?? 0) + 1)
  }
  for (const item of state.items) {
    if (item.groupId && (counts.get(item.groupId) ?? 0) < 2) {
      item.groupId = null
    }
  }
}

export type DragPlane = 'xy' | 'xz' | 'yz'

export type AlignState =
  | null
  | { phase: 'pickTarget'; sourceCorner: CornerId }
  | {
      phase: 'pickTargetCorner'
      sourceCorner: CornerId
      targetId: string
    }

export type MenuLevel =
  | 'root'
  | 'insert'
  | 'color'
  | 'move'
  | 'align'
  | 'alignTarget'

export type MenuMode = 'space' | 'object'

export type EdgeEditState = {
  edge: SizeEdge
  formOpen: boolean
}

export type ObjectsState = {
  items: SceneObject[]
  selectedIds: string[]
  clipboard: ClipboardState | null
  commandMenu: {
    open: boolean
    mode: MenuMode
    level: MenuLevel
  }
  sizeEdit: EdgeEditState | null
  rotateEdit: EdgeEditState | null
  dragPlane: DragPlane | null
  align: AlignState
}

const defaultsByType: Record<ObjectType, Pick<SceneObject, 'size' | 'rotation'>> =
  {
    cube: {
      size: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    box: {
      size: { x: 2, y: 1, z: 0.75 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    sphere: {
      size: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  }

const closedMenu = {
  open: false,
  mode: 'space' as MenuMode,
  level: 'root' as MenuLevel,
}

const initialState: ObjectsState = {
  items: [],
  selectedIds: [],
  clipboard: null,
  commandMenu: closedMenu,
  sizeEdit: null,
  rotateEdit: null,
  dragPlane: null,
  align: null,
}

const objectsSlice = createSlice({
  name: 'objects',
  initialState,
  reducers: {
    addObject: {
      reducer(state, action: PayloadAction<SceneObject>) {
        state.items.push(action.payload)
      },
      prepare(type: ObjectType) {
        const defaults = defaultsByType[type]
        return {
          payload: {
            id: nanoid(),
            type,
            size: { ...defaults.size },
            rotation: { ...defaults.rotation },
            position: { x: 0, y: 0, z: 0 },
            color: DEFAULT_OBJECT_COLOR,
            groupId: null,
          } satisfies SceneObject,
        }
      },
    },
    selectObject(
      state,
      action: PayloadAction<{ id: string | null; openMenu?: boolean }>,
    ) {
      const { id, openMenu = false } = action.payload
      state.sizeEdit = null
      state.rotateEdit = null

      if (!id) {
        state.selectedIds = []
        state.commandMenu = closedMenu
        return
      }

      state.selectedIds = expandWithGroup(state.items, id)

      if (
        !openMenu ||
        state.dragPlane ||
        state.align?.phase === 'pickTarget'
      ) {
        state.commandMenu = closedMenu
        return
      }

      state.commandMenu = {
        open: true,
        mode: 'object',
        level: 'root',
      }
    },
    /** Shift+click: add object (and its group) to the current selection. */
    addToSelection(state, action: PayloadAction<string>) {
      if (state.selectedIds.length === 0) {
        state.selectedIds = expandWithGroup(state.items, action.payload)
        state.commandMenu = closedMenu
        return
      }
      const next = expandWithGroup(state.items, action.payload)
      const rest = state.selectedIds.filter((id) => !next.includes(id))
      state.selectedIds = [...rest, ...next]
      state.commandMenu = closedMenu
    },
    /** Open object menu for the current selection without changing it. */
    openObjectMenu(state) {
      if (state.selectedIds.length === 0) return
      if (state.dragPlane || state.align?.phase === 'pickTarget') return
      state.commandMenu = {
        open: true,
        mode: 'object',
        level: 'root',
      }
    },
    toggleSpaceMenu(state) {
      if (state.commandMenu.open && state.commandMenu.mode === 'space') {
        state.commandMenu = closedMenu
        return
      }
      state.commandMenu = {
        open: true,
        mode: 'space',
        level: 'root',
      }
    },
    setMenuLevel(state, action: PayloadAction<MenuLevel>) {
      state.commandMenu.level = action.payload
    },
    closeCommandMenu(state) {
      state.commandMenu = closedMenu
    },
    startSizeEdit(state) {
      if (state.selectedIds.length !== 1) return
      state.sizeEdit = { edge: { ...DEFAULT_SIZE_EDGE }, formOpen: false }
      state.rotateEdit = null
      state.dragPlane = null
      state.align = null
      state.commandMenu = closedMenu
    },
    setSizeEdge(state, action: PayloadAction<SizeEdge>) {
      if (!state.sizeEdit) return
      state.sizeEdit.edge = action.payload
    },
    openSizeForm(state) {
      if (!state.sizeEdit) return
      state.sizeEdit.formOpen = true
      state.commandMenu = closedMenu
    },
    closeSizeForm(state) {
      if (!state.sizeEdit) return
      state.sizeEdit.formOpen = false
    },
    exitSizeEdit(state) {
      state.sizeEdit = null
    },
    startRotateEdit(state) {
      if (state.selectedIds.length === 0) return
      state.rotateEdit = { edge: { ...DEFAULT_SIZE_EDGE }, formOpen: false }
      state.sizeEdit = null
      state.dragPlane = null
      state.align = null
      state.commandMenu = closedMenu
    },
    setRotateEdge(state, action: PayloadAction<SizeEdge>) {
      if (!state.rotateEdit) return
      state.rotateEdit.edge = action.payload
    },
    openRotateForm(state) {
      if (!state.rotateEdit) return
      state.rotateEdit.formOpen = true
      state.commandMenu = closedMenu
    },
    closeRotateForm(state) {
      if (!state.rotateEdit) return
      state.rotateEdit.formOpen = false
    },
    exitRotateEdit(state) {
      state.rotateEdit = null
    },
    startDrag(state, action: PayloadAction<DragPlane>) {
      if (state.selectedIds.length === 0) return
      state.dragPlane = action.payload
      state.align = null
      state.sizeEdit = null
      state.rotateEdit = null
      state.commandMenu = closedMenu
    },
    clearDrag(state) {
      state.dragPlane = null
    },
    startAlign(state, action: PayloadAction<CornerId>) {
      if (state.selectedIds.length !== 1) return
      state.align = { phase: 'pickTarget', sourceCorner: action.payload }
      state.dragPlane = null
      state.sizeEdit = null
      state.rotateEdit = null
      state.commandMenu = closedMenu
    },
    pickAlignTarget(state, action: PayloadAction<string>) {
      if (!state.align || state.align.phase !== 'pickTarget') return
      const primary = primarySelectedId(state.selectedIds)
      if (!primary || action.payload === primary) return
      state.align = {
        phase: 'pickTargetCorner',
        sourceCorner: state.align.sourceCorner,
        targetId: action.payload,
      }
      state.commandMenu = {
        open: true,
        mode: 'object',
        level: 'alignTarget',
      }
    },
    clearAlign(state) {
      state.align = null
    },
    clearInteractionModes(state) {
      state.dragPlane = null
      state.align = null
      state.sizeEdit = null
      state.rotateEdit = null
    },
    removeObject(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
      state.selectedIds = state.selectedIds.filter(
        (id) => id !== action.payload,
      )
      dissolveSingletonGroups(state)
      if (
        state.align &&
        'targetId' in state.align &&
        state.align.targetId === action.payload
      ) {
        state.align = null
        state.commandMenu = closedMenu
      }
    },
    /** Y — copy selection into clipboard without removing. */
    yankSelected(state) {
      if (state.selectedIds.length === 0) return
      const objects = state.selectedIds
        .map((id) => state.items.find((entry) => entry.id === id))
        .filter((item): item is SceneObject => Boolean(item))
        .map(cloneClipboardObject)
      if (objects.length === 0) return
      state.clipboard = {
        objects,
        asGroup: isGroupSelection(state.items, state.selectedIds),
      }
      state.commandMenu = closedMenu
    },
    /** X / Delete — yank selection, then remove it. */
    cutSelected(state) {
      if (state.selectedIds.length === 0) return
      const ids = [...state.selectedIds]
      const objects = ids
        .map((id) => state.items.find((entry) => entry.id === id))
        .filter((item): item is SceneObject => Boolean(item))
        .map(cloneClipboardObject)
      if (objects.length === 0) return
      state.clipboard = {
        objects,
        asGroup: isGroupSelection(state.items, state.selectedIds),
      }
      state.items = state.items.filter((entry) => !ids.includes(entry.id))
      state.selectedIds = []
      dissolveSingletonGroups(state)
      clearSelectionModes(state)
    },
    /** P — paste clipboard, offset so AABBs don't overlap. */
    pasteClipboard(state) {
      if (!state.clipboard || state.clipboard.objects.length === 0) return
      const deltaX = pasteGroupDeltaX(state.clipboard.objects)
      const groupId =
        state.clipboard.asGroup && state.clipboard.objects.length > 1
          ? nanoid()
          : null
      const newIds: string[] = []
      for (const source of state.clipboard.objects) {
        const copy: SceneObject = {
          id: nanoid(),
          type: source.type,
          size: { ...source.size },
          rotation: { ...source.rotation },
          position: {
            x: source.position.x + deltaX,
            y: source.position.y,
            z: source.position.z,
          },
          color: source.color,
          groupId,
        }
        state.items.push(copy)
        newIds.push(copy.id)
      }
      state.selectedIds = newIds
      state.clipboard = {
        objects: newIds
          .map((id) => state.items.find((entry) => entry.id === id)!)
          .map(cloneClipboardObject),
        asGroup: Boolean(groupId),
      }
      clearSelectionModes(state)
    },
    /** G — group current multi-selection. */
    groupSelected(state) {
      if (state.selectedIds.length < 2) return
      const groupId = nanoid()
      for (const id of state.selectedIds) {
        const item = state.items.find((entry) => entry.id === id)
        if (item) item.groupId = groupId
      }
      dissolveSingletonGroups(state)
      state.commandMenu = closedMenu
    },
    /** Shift+G — ungroup when a group is selected. */
    ungroupSelected(state) {
      if (!isGroupSelection(state.items, state.selectedIds)) return
      for (const id of state.selectedIds) {
        const item = state.items.find((entry) => entry.id === id)
        if (item) item.groupId = null
      }
      state.commandMenu = closedMenu
    },
    updateObjectSize(
      state,
      action: PayloadAction<{ id: string; size: Partial<Vec3> }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.size = { ...item.size, ...action.payload.size }
    },
    translateSelected(
      state,
      action: PayloadAction<{ delta: Vec3 }>,
    ) {
      const { delta } = action.payload
      for (const id of state.selectedIds) {
        const item = state.items.find((entry) => entry.id === id)
        if (!item) continue
        item.position = {
          x: item.position.x + delta.x,
          y: item.position.y + delta.y,
          z: item.position.z + delta.z,
        }
      }
    },
    updateObjectPosition(
      state,
      action: PayloadAction<{ id: string; position: Partial<Vec3> }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.position = { ...item.position, ...action.payload.position }
    },
    updateObjectRotation(
      state,
      action: PayloadAction<{ id: string; rotation: Partial<Vec3> }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.rotation = { ...item.rotation, ...action.payload.rotation }
    },
    updateObjectColor(
      state,
      action: PayloadAction<{ id: string; color: string }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.color = action.payload.color
    },
    /** Recolor every selected object. */
    updateSelectedColor(state, action: PayloadAction<string>) {
      for (const id of state.selectedIds) {
        const item = state.items.find((entry) => entry.id === id)
        if (item) item.color = action.payload
      }
    },
    /**
     * Rotate selection around an edge of `id` (rigid for the whole selection).
     */
    rotateObjectAroundEdge(
      state,
      action: PayloadAction<{
        id: string
        edge: SizeEdge
        degrees: -90 | 90 | 180
      }>,
    ) {
      const primary = state.items.find(
        (entry) => entry.id === action.payload.id,
      )
      if (!primary) return
      const { pivot, axis } = edgeWorldPivotAndAxis(
        primary.position,
        primary.rotation,
        primary.size,
        action.payload.edge,
      )
      const angle = (action.payload.degrees * Math.PI) / 180
      const targets =
        state.selectedIds.includes(primary.id) && state.selectedIds.length > 0
          ? state.selectedIds
          : [primary.id]
      for (const id of targets) {
        const item = state.items.find((entry) => entry.id === id)
        if (!item) continue
        const next = rotateAroundWorldAxis(
          item.position,
          item.rotation,
          pivot,
          axis,
          angle,
        )
        item.position = next.position
        item.rotation = next.rotation
      }
    },
    alignObjectCorners(
      state,
      action: PayloadAction<{
        id: string
        sourceCorner: CornerId
        targetId: string
        targetCorner: CornerId
      }>,
    ) {
      const source = state.items.find((entry) => entry.id === action.payload.id)
      const target = state.items.find(
        (entry) => entry.id === action.payload.targetId,
      )
      if (!source || !target) return
      source.position = positionToMatchCorners(
        source,
        action.payload.sourceCorner,
        target,
        action.payload.targetCorner,
      )
      state.align = null
      state.commandMenu = closedMenu
    },
  },
})

export const {
  addObject,
  selectObject,
  addToSelection,
  openObjectMenu,
  toggleSpaceMenu,
  setMenuLevel,
  closeCommandMenu,
  startSizeEdit,
  setSizeEdge,
  openSizeForm,
  closeSizeForm,
  exitSizeEdit,
  startRotateEdit,
  setRotateEdge,
  openRotateForm,
  closeRotateForm,
  exitRotateEdit,
  startDrag,
  clearDrag,
  startAlign,
  pickAlignTarget,
  clearAlign,
  clearInteractionModes,
  removeObject,
  yankSelected,
  cutSelected,
  pasteClipboard,
  groupSelected,
  ungroupSelected,
  updateObjectSize,
  translateSelected,
  updateObjectPosition,
  updateObjectRotation,
  updateObjectColor,
  updateSelectedColor,
  rotateObjectAroundEdge,
  alignObjectCorners,
} = objectsSlice.actions

export type { CornerId, SizeEdge }
export default objectsSlice.reducer
