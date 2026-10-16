import { Euler, Quaternion, Vector3 } from 'three'

export type CornerId =
  | 'xyz'
  | 'xyZ'
  | 'xYz'
  | 'xYZ'
  | 'Xyz'
  | 'XyZ'
  | 'XYz'
  | 'XYZ'

type Vec3 = {
  x: number
  y: number
  z: number
}

export const CORNERS: { id: CornerId; letter: string; label: string }[] = [
  { id: 'xyz', letter: 'a', label: 'a: xyz' },
  { id: 'xyZ', letter: 'b', label: 'b: xyZ' },
  { id: 'xYz', letter: 'c', label: 'c: xYz' },
  { id: 'xYZ', letter: 'd', label: 'd: xYZ' },
  { id: 'Xyz', letter: 'e', label: 'e: Xyz' },
  { id: 'XyZ', letter: 'f', label: 'f: XyZ' },
  { id: 'XYz', letter: 'g', label: 'g: XYz' },
  { id: 'XYZ', letter: 'h', label: 'h: XYZ' },
]

function localCornerOffset(size: Vec3, corner: CornerId): Vector3 {
  return new Vector3(
    (corner[0] === 'X' ? 1 : -1) * (size.x / 2),
    (corner[1] === 'Y' ? 1 : -1) * (size.y / 2),
    (corner[2] === 'Z' ? 1 : -1) * (size.z / 2),
  )
}

function worldCorner(
  position: Vec3,
  rotation: Vec3,
  size: Vec3,
  corner: CornerId,
): Vector3 {
  const orientation = new Quaternion().setFromEuler(
    new Euler(rotation.x, rotation.y, rotation.z, 'XYZ'),
  )
  return localCornerOffset(size, corner)
    .applyQuaternion(orientation)
    .add(new Vector3(position.x, position.y, position.z))
}

/** Move source so its corner coincides with the target's corner in world space. */
export function positionToMatchCorners(
  source: { position: Vec3; rotation: Vec3; size: Vec3 },
  sourceCorner: CornerId,
  target: { position: Vec3; rotation: Vec3; size: Vec3 },
  targetCorner: CornerId,
): Vec3 {
  const targetWorld = worldCorner(
    target.position,
    target.rotation,
    target.size,
    targetCorner,
  )
  const orientation = new Quaternion().setFromEuler(
    new Euler(source.rotation.x, source.rotation.y, source.rotation.z, 'XYZ'),
  )
  const sourceLocal = localCornerOffset(source.size, sourceCorner).applyQuaternion(
    orientation,
  )

  return {
    x: targetWorld.x - sourceLocal.x,
    y: targetWorld.y - sourceLocal.y,
    z: targetWorld.z - sourceLocal.z,
  }
}
