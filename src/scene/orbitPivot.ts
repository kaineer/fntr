import type { Camera } from 'three'
import type { SceneObject } from '../store/objectsSlice.ts'

export const SCENE_ORIGIN = { x: 0, y: 0, z: 0 } as const

/** Camera elevation above the horizontal when looking at the orbit pivot. */
export const ORBIT_ELEVATION_DEG = 20
export const ORBIT_ELEVATION_RAD = (ORBIT_ELEVATION_DEG * Math.PI) / 180

export type OrbitPivot = { x: number; y: number; z: number }

/** Mutable orbit / zoom / pan pivot (WASD can offset it until selection changes). */
let livePivot: OrbitPivot = { ...SCENE_ORIGIN }

export function getOrbitPivot(): OrbitPivot {
  return livePivot
}

export function setOrbitPivot(pivot: OrbitPivot) {
  livePivot = { x: pivot.x, y: pivot.y, z: pivot.z }
}

export function panOrbitPivot(dx: number, dy: number, dz: number) {
  livePivot = {
    x: livePivot.x + dx,
    y: livePivot.y + dy,
    z: livePivot.z + dz,
  }
}

/** Centroid of selection, else scene origin. */
export function selectionCentroid(
  items: SceneObject[],
  selectedIds: string[],
): OrbitPivot {
  if (selectedIds.length === 0) return { ...SCENE_ORIGIN }

  let x = 0
  let y = 0
  let z = 0
  let count = 0
  for (const id of selectedIds) {
    const item = items.find((entry) => entry.id === id)
    if (!item) continue
    x += item.position.x
    y += item.position.y
    z += item.position.z
    count += 1
  }
  if (count === 0) return { ...SCENE_ORIGIN }
  return { x: x / count, y: y / count, z: z / count }
}

/**
 * Keep XZ azimuth & horizontal distance; set height so the view angle
 * down to the pivot is ORBIT_ELEVATION_DEG.
 */
export function aimCameraAtPivot(camera: Camera, pivot: OrbitPivot) {
  const ox = camera.position.x - pivot.x
  const oz = camera.position.z - pivot.z
  let horizontal = Math.hypot(ox, oz)

  if (horizontal < 1e-6) {
    horizontal = 5
    camera.position.x = pivot.x + horizontal
    camera.position.z = pivot.z
  }

  camera.position.y = pivot.y + horizontal * Math.tan(ORBIT_ELEVATION_RAD)
  camera.lookAt(pivot.x, pivot.y, pivot.z)
  camera.updateProjectionMatrix()
}

/** Initial camera: same azimuth as before, elevation fixed at 20°. */
export function initialOrbitCameraPosition(
  azimuthX = 3.2,
  azimuthZ = 4.2,
): [number, number, number] {
  const horizontal = Math.hypot(azimuthX, azimuthZ)
  const y = horizontal * Math.tan(ORBIT_ELEVATION_RAD)
  return [azimuthX, y, azimuthZ]
}
