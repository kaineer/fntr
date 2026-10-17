import { type ThreeEvent } from '@react-three/fiber'
import {
  SIZE_EDGES,
  sizeEdgeId,
  sizeEdgeLocal,
  sizeEdgesEqual,
  type SizeEdge,
} from '../store/sizeEdge.ts'
import type { Vec3 } from '../store/objectsSlice.ts'

const EDGE_THICKNESS = 0.07
const EDGE_HIGHLIGHT = '#f4a261'

type EdgeHandlesProps = {
  size: Vec3
  selectedEdge: SizeEdge
  onSelect: (edge: SizeEdge) => void
}

export function EdgeHandles({
  size,
  selectedEdge,
  onSelect,
}: EdgeHandlesProps) {
  return (
    <group>
      {SIZE_EDGES.map((edge) => {
        const active = sizeEdgesEqual(edge, selectedEdge)
        const { position, args } = sizeEdgeLocal(edge, size, EDGE_THICKNESS)

        const onClick = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect(edge)
        }

        return (
          <group key={sizeEdgeId(edge)} position={position}>
            {/* Raycast-only: never writes color, so no leftover stain. */}
            <mesh onClick={onClick}>
              <boxGeometry args={args} />
              <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </mesh>
            {active ? (
              <mesh>
                <boxGeometry args={args} />
                <meshStandardMaterial
                  color={EDGE_HIGHLIGHT}
                  emissive={EDGE_HIGHLIGHT}
                  emissiveIntensity={0.55}
                />
              </mesh>
            ) : null}
          </group>
        )
      })}
    </group>
  )
}
