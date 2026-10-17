export type SizeAxis = 'x' | 'y' | 'z'
export type EdgeSign = 1 | -1

/**
 * Box edge: runs along `axis`; `u`/`v` are signs on the other two axes
 * (for x: u=y, v=z; for y: u=x, v=z; for z: u=x, v=y).
 */
export type SizeEdge = {
  axis: SizeAxis
  u: EdgeSign
  v: EdgeSign
}

export type SizeEdgeId = `${SizeAxis}:${EdgeSign}:${EdgeSign}`

const SIGNS: EdgeSign[] = [1, -1]
const AXES: SizeAxis[] = ['x', 'y', 'z']

export const SIZE_EDGES: SizeEdge[] = AXES.flatMap((axis) =>
  SIGNS.flatMap((u) => SIGNS.map((v) => ({ axis, u, v }))),
)

export const DEFAULT_SIZE_EDGE: SizeEdge = { axis: 'x', u: 1, v: 1 }

export function sizeEdgeId(edge: SizeEdge): SizeEdgeId {
  return `${edge.axis}:${edge.u}:${edge.v}`
}

export function sizeEdgesEqual(a: SizeEdge, b: SizeEdge): boolean {
  return a.axis === b.axis && a.u === b.u && a.v === b.v
}

export function sizeEdgeAxis(edge: SizeEdge): SizeAxis {
  return edge.axis
}

function signLabel(sign: EdgeSign): string {
  return sign === 1 ? '+' : '−'
}

export function sizeEdgeLabel(edge: SizeEdge): string {
  const axis = edge.axis.toUpperCase()
  if (edge.axis === 'x') {
    return `${axis} @ ${signLabel(edge.u)}Y ${signLabel(edge.v)}Z`
  }
  if (edge.axis === 'y') {
    return `${axis} @ ${signLabel(edge.u)}X ${signLabel(edge.v)}Z`
  }
  return `${axis} @ ${signLabel(edge.u)}X ${signLabel(edge.v)}Y`
}

/** Local-space center and box args for a thin edge handle. */
export function sizeEdgeLocal(
  edge: SizeEdge,
  size: { x: number; y: number; z: number },
  thickness: number,
): { position: [number, number, number]; args: [number, number, number] } {
  const hx = size.x / 2
  const hy = size.y / 2
  const hz = size.z / 2

  if (edge.axis === 'x') {
    return {
      position: [0, edge.u * hy, edge.v * hz],
      args: [size.x, thickness, thickness],
    }
  }
  if (edge.axis === 'y') {
    return {
      position: [edge.u * hx, 0, edge.v * hz],
      args: [thickness, size.y, thickness],
    }
  }
  return {
    position: [edge.u * hx, edge.v * hy, 0],
    args: [thickness, thickness, size.z],
  }
}
