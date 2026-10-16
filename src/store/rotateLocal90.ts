import { Euler, Quaternion, Vector3 } from 'three'

export type RotationAxis = 'x' | 'y' | 'z'

type Vec3 = {
  x: number
  y: number
  z: number
}

const AXIS_VECTORS: Record<RotationAxis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const HALF_PI = Math.PI / 2

export function rotateLocal90(
  rotation: Vec3,
  axis: RotationAxis,
  sign: 1 | -1,
): Vec3 {
  const euler = new Euler(rotation.x, rotation.y, rotation.z, 'XYZ')
  const orientation = new Quaternion().setFromEuler(euler)
  const delta = new Quaternion().setFromAxisAngle(
    AXIS_VECTORS[axis],
    sign * HALF_PI,
  )

  // Local-space rotation: apply delta after current orientation.
  orientation.multiply(delta)

  const next = new Euler().setFromQuaternion(orientation, 'XYZ')
  return { x: next.x, y: next.y, z: next.z }
}
