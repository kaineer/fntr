import { BackSide } from 'three'

const OUTLINE_COLOR = '#3b82f6'
const OUTLINE_SCALE = 1.055

type SelectionOutlineProps = {
  shape: 'box' | 'sphere'
  size: { x: number; y: number; z: number }
}

/** Bluish shell just outside the mesh; ignores raycasts. */
export function SelectionOutline({ shape, size }: SelectionOutlineProps) {
  return (
    <mesh
      scale={
        shape === 'sphere'
          ? OUTLINE_SCALE
          : [OUTLINE_SCALE, OUTLINE_SCALE, OUTLINE_SCALE]
      }
      raycast={() => {}}
    >
      {shape === 'sphere' ? (
        <sphereGeometry args={[0.5, 32, 32]} />
      ) : (
        <boxGeometry args={[size.x, size.y, size.z]} />
      )}
      <meshBasicMaterial
        color={OUTLINE_COLOR}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
