import type { RootState } from '../store/store.ts'

export const SCENE_ORIGIN = { x: 0, y: 0, z: 0 } as const

/** Orbit / zoom pivot: selected object center, else scene origin. */
export function selectOrbitPivot(state: RootState) {
  const id = state.objects.selectedId
  if (!id) return SCENE_ORIGIN
  const item = state.objects.items.find((entry) => entry.id === id)
  return item?.position ?? SCENE_ORIGIN
}
