import { type ThreeEvent } from '@react-three/fiber'
import { CORNERS, cornerLocalPosition, type CornerId } from '../store/corners.ts'
import type { Vec3 } from '../store/objectsSlice.ts'

const CORNER_RADIUS = 0.08
const CORNER_COLOR = '#3b82f6'
const CORNER_ACTIVE = '#f4a261'

type CornerHandlesProps = {
  size: Vec3
  selectedCorner?: CornerId | null
  onSelect: (corner: CornerId) => void
}

export function CornerHandles({
  size,
  selectedCorner = null,
  onSelect,
}: CornerHandlesProps) {
  return (
    <group>
      {CORNERS.map((corner) => {
        const active = selectedCorner === corner.id
        const position = cornerLocalPosition(size, corner.id)

        const onClick = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect(corner.id)
        }

        return (
          <mesh key={corner.id} position={position} onClick={onClick}>
            <sphereGeometry args={[CORNER_RADIUS, 16, 16]} />
            <meshStandardMaterial
              color={active ? CORNER_ACTIVE : CORNER_COLOR}
              emissive={active ? CORNER_ACTIVE : CORNER_COLOR}
              emissiveIntensity={active ? 0.55 : 0.35}
            />
          </mesh>
        )
      })}
    </group>
  )
}
