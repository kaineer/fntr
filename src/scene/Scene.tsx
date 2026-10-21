import type { RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppSelector } from '../store/hooks.ts'
import {
  EmptyClickTracker,
  NonRaycastGrid,
  useDismissOnEmptyClick,
} from './EmptyClickDismiss.tsx'
import { initialOrbitCameraPosition } from './orbitPivot.ts'
import { OrbitY } from './OrbitY.tsx'
import { OverlayTracker } from './OverlayTracker.tsx'
import { PanKeys } from './PanKeys.tsx'
import { RotateEdgeDrag } from './RotateEdgeDrag.tsx'
import { SceneObjectMesh } from './SceneObjectMesh.tsx'
import { WheelZoom } from './WheelZoom.tsx'

const INITIAL_CAMERA = initialOrbitCameraPosition()

type SceneProps = {
  overlayRef: RefObject<HTMLElement | null>
}

export function Scene({ overlayRef }: SceneProps) {
  const objects = useAppSelector((state) => state.objects.items)
  const onPointerMissed = useDismissOnEmptyClick()

  return (
    <Canvas
      camera={{ position: INITIAL_CAMERA, fov: 50 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0)
      }}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={['#d8dce3']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.35} />
      <NonRaycastGrid args={[20, 20, '#9aa3b2', '#c8cfd9']} />
      <EmptyClickTracker />
      <WheelZoom />
      <OrbitY />
      <PanKeys />
      <RotateEdgeDrag />
      <OverlayTracker overlayRef={overlayRef} />
      {objects.map((object) => (
        <SceneObjectMesh key={object.id} object={object} />
      ))}
    </Canvas>
  )
}
