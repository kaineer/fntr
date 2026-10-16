import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'
import { positionToMatchCorners, type CornerId } from './corners.ts'
import {
  rotateLocal90,
  type RotationAxis,
} from './rotateLocal90.ts'

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
  | 'rotate'
  | 'rotateDir'
  | 'move'
  | 'align'
  | 'alignTarget'

export type MenuMode = 'space' | 'object'

export type ObjectsState = {
  items: SceneObject[]
  selectedId: string | null
  commandMenu: {
    open: boolean
    mode: MenuMode
    level: MenuLevel
  }
  sizeFormOpen: boolean
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
  sizeFormOpen: false,
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
      state.sizeFormOpen = false

      if (!id) {
        state.commandMenu = closedMenu
        return
      }

      if (!openMenu || state.dragPlane || state.align?.phase === 'pickTarget') {
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
    openSizeForm(state) {
      if (!state.selectedId) return
      state.sizeFormOpen = true
      state.commandMenu = closedMenu
    },
    closeSizeForm(state) {
      state.sizeFormOpen = false
    },
    startDrag(state, action: PayloadAction<DragPlane>) {
      if (!state.selectedId) return
      state.dragPlane = action.payload
      state.align = null
      state.sizeFormOpen = false
      state.commandMenu = closedMenu
    },
    clearDrag(state) {
      state.dragPlane = null
    },
    startAlign(state, action: PayloadAction<CornerId>) {
      if (!state.selectedId) return
      state.align = { phase: 'pickTarget', sourceCorner: action.payload }
      state.dragPlane = null
      state.sizeFormOpen = false
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
    },
    removeObject(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
      if (state.selectedId === action.payload) {
        state.selectedId = null
        state.sizeFormOpen = false
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
    rotateObjectBy90(
      state,
      action: PayloadAction<{
        id: string
        axis: RotationAxis
        sign: 1 | -1
      }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (!item) return
      item.rotation = rotateLocal90(
        item.rotation,
        action.payload.axis,
        action.payload.sign,
      )
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
  openSizeForm,
  closeSizeForm,
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
  rotateObjectBy90,
  alignObjectCorners,
} = objectsSlice.actions

export type { RotationAxis, CornerId }
export default objectsSlice.reducer
