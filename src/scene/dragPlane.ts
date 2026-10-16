import { Plane, Vector3 } from 'three'
import type { DragPlane } from '../store/objectsSlice.ts'

const NORMALS: Record<DragPlane, Vector3> = {
  xy: new Vector3(0, 0, 1),
  xz: new Vector3(0, 1, 0),
  yz: new Vector3(1, 0, 0),
}

export function planeThroughPoint(
  dragPlane: DragPlane,
  point: { x: number; y: number; z: number },
): Plane {
  return new Plane().setFromNormalAndCoplanarPoint(
    NORMALS[dragPlane],
    new Vector3(point.x, point.y, point.z),
  )
}
