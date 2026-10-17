import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'
import { positionToMatchCorners, type CornerId } from './corners.ts'
import { rotateAroundEdge } from './rotateAroundEdge.ts'
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
}

export const DEFAULT_OBJECT_COLOR = '#6ea8fe'

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
  selectedId: string | null
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
  selectedId: null,
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
          } satisfies SceneObject,
        }
      },
    },
    selectObject(
      state,
      action: PayloadAction<{ id: string | null; openMenu?: boolean }>,
    ) {
      const { id, openMenu = true } = action.payload
      state.selectedId = id
      state.sizeEdit = null
      state.rotateEdit = null

      if (!id) {
        state.commandMenu = closedMenu
        return
      }

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
      if (!state.selectedId) return
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
      if (!state.selectedId) return
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
      if (!state.selectedId) return
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
      if (!state.selectedId) return
      state.align = { phase: 'pickTarget', sourceCorner: action.payload }
      state.dragPlane = null
      state.sizeEdit = null
      state.rotateEdit = null
      state.commandMenu = closedMenu
    },
    pickAlignTarget(state, action: PayloadAction<string>) {
      if (!state.align || state.align.phase !== 'pickTarget') return
      if (!state.selectedId || action.payload === state.selectedId) return
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
      if (state.selectedId === action.payload) {
        state.selectedId = null
        state.sizeEdit = null
        state.rotateEdit = null
        state.commandMenu = closedMenu
        state.dragPlane = null
        state.align = null
      }
      if (
        state.align &&
        'targetId' in state.align &&
        state.align.targetId === action.payload
      ) {
        state.align = null
        state.commandMenu = closedMenu
      }
    },
    updateObjectSize(
      state,
      action: PayloadAction<{ id: string; size: Partial<Vec3> }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.size = { ...item.size, ...action.payload.size }
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
    rotateObjectAroundEdge(
      state,
      action: PayloadAction<{
        id: string
        edge: SizeEdge
        degrees: -90 | 90 | 180
      }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      const next = rotateAroundEdge(
        item.position,
        item.rotation,
        item.size,
        action.payload.edge,
        (action.payload.degrees * Math.PI) / 180,
      )
      item.position = next.position
      item.rotation = next.rotation
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
  updateObjectSize,
  updateObjectPosition,
  updateObjectRotation,
  updateObjectColor,
  rotateObjectAroundEdge,
  alignObjectCorners,
} = objectsSlice.actions

export type { CornerId, SizeEdge }
export default objectsSlice.reducer
