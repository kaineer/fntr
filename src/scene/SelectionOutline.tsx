import { BackSide } from 'three'

const OUTLINE_COLOR = '#3b82f6'
/** Absolute shell thickness outside the mesh (world units). */
const OUTLINE_PAD = 0.05

type SelectionOutlineProps = {
  shape: 'box' | 'sphere'
  size: { x: number; y: number; z: number }
}

/**
 * Bluish shell just outside the mesh; ignores raycasts.
 * Uses a fixed pad per axis so long thin objects stay readable
 * (no huge overhang along the long side, still visible across thin sides).
 */
export function SelectionOutline({ shape, size }: SelectionOutlineProps) {
  if (shape === 'sphere') {
    // Parent mesh already scales by `size`; grow each local axis by a fixed pad.
    const scale: [number, number, number] = [
      1 + (2 * OUTLINE_PAD) / size.x,
      1 + (2 * OUTLINE_PAD) / size.y,
      1 + (2 * OUTLINE_PAD) / size.z,
    ]
    return (
      <mesh scale={scale} raycast={() => {}}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color={OUTLINE_COLOR}
          side={BackSide}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    )
  }

  return (
    <mesh raycast={() => {}}>
      <boxGeometry
        args={[
          size.x + 2 * OUTLINE_PAD,
          size.y + 2 * OUTLINE_PAD,
          size.z + 2 * OUTLINE_PAD,
        ]}
      />
      <meshBasicMaterial
        color={OUTLINE_COLOR}
        side={BackSide}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </mesh>
  )
}
