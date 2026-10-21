export type MoveAxis = 'x' | 'y' | 'z'

export const MOVE_AXES: MoveAxis[] = ['x', 'y', 'z']

export const DEFAULT_MOVE_AXIS: MoveAxis = 'x'

/** Fixed handle length — does not grow with the object. */
export const MOVE_AXIS_LENGTH = 0.5

export function moveAxisLabel(axis: MoveAxis): string {
  return axis.toUpperCase()
}

/**
 * Axis handle rooted at a world-space corner, extending outward along a
 * world axis (away from the object center) by a fixed length.
 */
export function moveAxisFromCorner(
  axis: MoveAxis,
  cornerWorld: { x: number; y: number; z: number },
  center: { x: number; y: number; z: number },
  thickness: number,
  length: number = MOVE_AXIS_LENGTH,
): { position: [number, number, number]; args: [number, number, number] } {
  const outward = cornerWorld[axis] - center[axis]
  const sign: 1 | -1 = outward >= 0 ? 1 : -1
  const mid = sign * (length / 2)

  if (axis === 'x') {
    return { position: [mid, 0, 0], args: [length, thickness, thickness] }
  }
  if (axis === 'y') {
    return { position: [0, mid, 0], args: [thickness, length, thickness] }
  }
  return { position: [0, 0, mid], args: [thickness, thickness, length] }
}
