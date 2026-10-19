export interface Vec3 {
  x: number
  y: number
  z: number
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function roundVec(v: Vec3): Vec3 {
  return { x: round3(v.x), y: round3(v.y), z: round3(v.z) }
}

export function radToDeg(v: Vec3): Vec3 {
  const f = 180 / Math.PI
  return roundVec({ x: v.x * f, y: v.y * f, z: v.z * f })
}

export function degToRad(v: Vec3): Vec3 {
  const f = Math.PI / 180
  return { x: v.x * f, y: v.y * f, z: v.z * f }
}

export function isVec3(value: unknown): value is Vec3 {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.x === 'number' &&
    typeof v.y === 'number' &&
    typeof v.z === 'number'
  )
}
