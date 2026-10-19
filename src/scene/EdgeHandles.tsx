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
const EDGE_PREVIEW = '#6ea8fe'

type EdgeHandlesProps = {
  size: Vec3
  selectedEdge: SizeEdge | null
  onSelect: (edge: SizeEdge) => void
  /** Draw faint handles for inactive edges (multi-object rotate). */
  previewInactive?: boolean
}

export function EdgeHandles({
  size,
  selectedEdge,
  onSelect,
  previewInactive = false,
}: EdgeHandlesProps) {
  return (
    <group>
      {SIZE_EDGES.map((edge) => {
        const active = selectedEdge
          ? sizeEdgesEqual(edge, selectedEdge)
          : false
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
            ) : previewInactive ? (
              <mesh raycast={() => {}}>
                <boxGeometry args={args} />
                <meshBasicMaterial
                  color={EDGE_PREVIEW}
                  transparent
                  opacity={0.4}
                  depthWrite={false}
                />
              </mesh>
            ) : null}
          </group>
        )
      })}
    </group>
  )
}
