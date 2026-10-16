import type { ThreeEvent } from '@react-three/fiber'
import { selectObject, type SceneObject } from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type SceneObjectMeshProps = {
  object: SceneObject
}

export function SceneObjectMesh({ object }: SceneObjectMeshProps) {
  const dispatch = useAppDispatch()
  const selected = useAppSelector(
    (state) => state.objects.selectedId === object.id,
  )
  const { size, rotation, type, color } = object
  const rotationRad: [number, number, number] = [
    rotation.x,
    rotation.y,
    rotation.z,
  ]

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    dispatch(selectObject(object.id))
  }

  if (type === 'sphere') {
    return (
      <mesh
        rotation={rotationRad}
        scale={[size.x, size.y, size.z]}
        onClick={onClick}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      </mesh>
    )
  }

  return (
    <mesh rotation={rotationRad} onClick={onClick}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.18 : 0}
      />
    </mesh>
  )
}
