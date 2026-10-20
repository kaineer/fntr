import { Vector3 } from 'three'
import type { MoveAxis } from '../store/moveAxis.ts'

const AXIS_DIR: Record<MoveAxis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const _w0 = new Vector3()
const _rayDir = new Vector3()

/**
 * Parameter `t` along the unit world axis through `axisOrigin` for the
 * point on that axis closest to the camera ray.
 *
 * Object target on the axis is `axisOrigin[axis] + t`.
 * Robust when the view is nearly edge-on to a drag plane (thin rods, etc.).
 */
export function rayClosestAxisT(
  rayOrigin: Vector3,
  rayDirection: Vector3,
  axisOrigin: { x: number; y: number; z: number },
  axis: MoveAxis,
): number {
  const axisDir = AXIS_DIR[axis]
  _rayDir.copy(rayDirection).normalize()
  _w0.set(
    rayOrigin.x - axisOrigin.x,
    rayOrigin.y - axisOrigin.y,
    rayOrigin.z - axisOrigin.z,
  )

  const b = _rayDir.dot(axisDir)
  const d = _rayDir.dot(_w0)
  const e = axisDir.dot(_w0)
  const denom = 1 - b * b

  // Ray parallel to axis: fall back to projecting the ray origin onto the axis.
  if (Math.abs(denom) < 1e-8) return e
  return (e - b * d) / denom
}
