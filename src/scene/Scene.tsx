import type { RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppSelector } from '../store/hooks.ts'
import { OverlayTracker } from './OverlayTracker.tsx'
import { SceneObjectMesh } from './SceneObjectMesh.tsx'
import { WheelZoom } from './WheelZoom.tsx'

type SceneProps = {
  overlayRef: RefObject<HTMLElement | null>
}

export function Scene({ overlayRef }: SceneProps) {
  const objects = useAppSelector((state) => state.objects.items)

  return (
    <Canvas
      camera={{ position: [3.2, 2.4, 4.2], fov: 50 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <color attach="background" args={['#0b1020']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} />
      <gridHelper args={[20, 20, '#2a3550', '#1a2236']} />
      <WheelZoom />
      <OverlayTracker overlayRef={overlayRef} />
      {objects.map((object) => (
        <SceneObjectMesh key={object.id} object={object} />
      ))}
    </Canvas>
  )
}
