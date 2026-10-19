import { Euler, Quaternion, Vector3 } from 'three'

type Vec3 = {
  x: number
  y: number
  z: number
}

type PasteSource = {
  type: 'cube' | 'box' | 'sphere'
  size: Vec3
  rotation: Vec3
  position: Vec3
}

const PASTE_GAP = 0.05

/** World AABB half-extents for a sized object (box or sphere). */
function worldHalfExtents(source: PasteSource): Vec3 {
  const { type, size, rotation } = source

  if (type === 'sphere') {
    return { x: size.x / 2, y: size.y / 2, z: size.z / 2 }
  }

  const orientation = new Quaternion().setFromEuler(
    new Euler(rotation.x, rotation.y, rotation.z, 'XYZ'),
  )
  const local = new Vector3(size.x / 2, size.y / 2, size.z / 2)
  let maxX = 0
  let maxY = 0
  let maxZ = 0

  for (const sx of [-1, 1] as const) {
    for (const sy of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const corner = new Vector3(
          local.x * sx,
          local.y * sy,
          local.z * sz,
        ).applyQuaternion(orientation)
        maxX = Math.max(maxX, Math.abs(corner.x))
        maxY = Math.max(maxY, Math.abs(corner.y))
        maxZ = Math.max(maxZ, Math.abs(corner.z))
      }
    }
  }

  return { x: maxX, y: maxY, z: maxZ }
}

/**
 * Place a paste beside the source: same Y/Z, shifted on X by full world width + gap
 * so AABBs do not intersect.
 */
export function pastePositionBeside(source: PasteSource): Vec3 {
  const half = worldHalfExtents(source)
  return {
    x: source.position.x + 2 * half.x + PASTE_GAP,
    y: source.position.y,
    z: source.position.z,
  }
}
