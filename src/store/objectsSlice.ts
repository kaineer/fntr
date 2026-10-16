import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'
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
  color: string
}

export const DEFAULT_OBJECT_COLOR = '#6ea8fe'

export type MenuLevel = 'root' | 'insert' | 'color' | 'rotate' | 'rotateDir'
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
            color: DEFAULT_OBJECT_COLOR,
          } satisfies SceneObject,
        }
      },
    },
    selectObject(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
      state.sizeFormOpen = false
      if (action.payload) {
        state.commandMenu = {
          open: true,
          mode: 'object',
          level: 'root',
        }
      } else {
        state.commandMenu = closedMenu
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
    removeObject(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
      if (state.selectedId === action.payload) {
        state.selectedId = null
        state.sizeFormOpen = false
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
  removeObject,
  updateObjectSize,
  updateObjectRotation,
  updateObjectColor,
  rotateObjectBy90,
} = objectsSlice.actions

export type { RotationAxis }
export default objectsSlice.reducer
