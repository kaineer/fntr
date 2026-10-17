import { Euler, Quaternion, Vector3 } from 'three'
import { sizeEdgeLocal, type SizeEdge } from './sizeEdge.ts'

type Vec3 = {
  x: number
  y: number
  z: number
}

const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
} as const

/** Rotate position+orientation around a box edge (edge stays fixed in world). */
export function rotateAroundEdge(
  position: Vec3,
  rotation: Vec3,
  size: Vec3,
  edge: SizeEdge,
  angle: number,
): { position: Vec3; rotation: Vec3 } {
  const orientation = new Quaternion().setFromEuler(
    new Euler(rotation.x, rotation.y, rotation.z, 'XYZ'),
  )

  const localCenter = sizeEdgeLocal(edge, size, 0).position
  const localAxis = AXIS_VECTORS[edge.axis]

  const worldAxis = localAxis.clone().applyQuaternion(orientation).normalize()
  const pivot = new Vector3(localCenter[0], localCenter[1], localCenter[2])
    .applyQuaternion(orientation)
    .add(new Vector3(position.x, position.y, position.z))

  const delta = new Quaternion().setFromAxisAngle(worldAxis, angle)
  const nextOrientation = delta.clone().multiply(orientation)
  const nextEuler = new Euler().setFromQuaternion(nextOrientation, 'XYZ')

  const nextPosition = new Vector3(position.x, position.y, position.z)
    .sub(pivot)
    .applyQuaternion(delta)
    .add(pivot)

  return {
    position: {
      x: nextPosition.x,
      y: nextPosition.y,
      z: nextPosition.z,
    },
    rotation: {
      x: nextEuler.x,
      y: nextEuler.y,
      z: nextEuler.z,
    },
  }
}
