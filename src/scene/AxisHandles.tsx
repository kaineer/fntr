import { useLayoutEffect, useRef, useState } from 'react'
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Group } from 'three'
import {
  nearestCornerToCamera,
  worldCorner,
  type CornerId,
} from '../store/corners.ts'
import {
  MOVE_AXES,
  moveAxisFromCorner,
  type MoveAxis,
} from '../store/moveAxis.ts'
import type { Vec3 } from '../store/objectsSlice.ts'

const AXIS_THICKNESS = 0.07

const AXIS_COLORS: Record<MoveAxis, string> = {
  x: '#e07470',
  y: '#6dbf8a',
  z: '#6ea8fe',
}

type AxisHandlesProps = {
  position: Vec3
  rotation: Vec3
  size: Vec3
  selectedAxis: MoveAxis
  onSelect: (axis: MoveAxis) => void
}

export function AxisHandles({
  position,
  rotation,
  size,
  selectedAxis,
  onSelect,
}: AxisHandlesProps) {
  const camera = useThree((state) => state.camera)
  const groupRef = useRef<Group>(null)
  const [corner, setCorner] = useState<CornerId>(() =>
    nearestCornerToCamera(position, rotation, size, camera.position),
  )
  const cornerRef = useRef(corner)
  cornerRef.current = corner

  const cornerWorld = worldCorner(position, rotation, size, corner)

  // Keep the gizmo on the camera-facing corner while orbiting.
  useFrame(() => {
    const next = nearestCornerToCamera(
      position,
      rotation,
      size,
      camera.position,
    )
    if (next !== cornerRef.current) {
      setCorner(next)
    }

    const group = groupRef.current
    if (!group) return
    const world = worldCorner(position, rotation, size, next)
    group.position.copy(world)
  })

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.position.set(cornerWorld.x, cornerWorld.y, cornerWorld.z)
  }, [cornerWorld.x, cornerWorld.y, cornerWorld.z])

  return (
    <group ref={groupRef}>
      {MOVE_AXES.map((axis) => {
        const active = axis === selectedAxis
        const { position: localPos, args } = moveAxisFromCorner(
          axis,
          cornerWorld,
          position,
          AXIS_THICKNESS,
        )
        const color = AXIS_COLORS[axis]

        const onClick = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect(axis)
        }

        return (
          <group key={`${corner}-${axis}`} position={localPos}>
            {/* Raycast-only: never writes color, so no leftover stain. */}
            <mesh onClick={onClick}>
              <boxGeometry args={args} />
              <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </mesh>
            <mesh raycast={() => {}}>
              <boxGeometry args={args} />
              {active ? (
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.55}
                />
              ) : (
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.4}
                  depthWrite={false}
                />
              )}
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
