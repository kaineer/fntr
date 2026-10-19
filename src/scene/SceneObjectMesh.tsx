import { useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { Plane, Vector3 } from 'three'
import {
  pickAlignTarget,
  selectObject,
  setRotateEdge,
  setSizeEdge,
  updateObjectPosition,
  type SceneObject,
} from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { planeThroughPoint } from './dragPlane.ts'
import { EdgeHandles } from './EdgeHandles.tsx'
import { SelectionOutline } from './SelectionOutline.tsx'

type SceneObjectMeshProps = {
  object: SceneObject
}

export function SceneObjectMesh({ object }: SceneObjectMeshProps) {
  const dispatch = useAppDispatch()
  const selected = useAppSelector(
    (state) => state.objects.selectedId === object.id,
  )
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const dragging = useRef(false)
  const moved = useRef(false)
  const activePlane = useRef(new Plane())
  const grabOffset = useRef(new Vector3())
  const hitPoint = useRef(new Vector3())

  const { size, rotation, type, color, position } = object
  const rotationRad: [number, number, number] = [
    rotation.x,
    rotation.y,
    rotation.z,
  ]
  const positionVec: [number, number, number] = [
    position.x,
    position.y,
    position.z,
  ]

  const edgeEdit = sizeEdit ?? rotateEdit
  const edgeEditing = Boolean(edgeEdit && selected)
  const isBox = type === 'cube' || type === 'box'

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (moved.current) {
      moved.current = false
      return
    }

    if (align?.phase === 'pickTarget') {
      dispatch(pickAlignTarget(object.id))
      return
    }

    if (sizeEdit || rotateEdit) {
      if (!selected) {
        dispatch(selectObject({ id: object.id, openMenu: false }))
      }
      return
    }

    // LMB selects only; context menu opens on RMB.
    dispatch(selectObject({ id: object.id, openMenu: false }))
  }

  const onContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    event.nativeEvent.preventDefault()

    if (align?.phase === 'pickTarget') {
      dispatch(pickAlignTarget(object.id))
      return
    }

    if (sizeEdit || rotateEdit || dragPlane) {
      dispatch(selectObject({ id: object.id, openMenu: false }))
      return
    }

    dispatch(selectObject({ id: object.id, openMenu: true }))
  }

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!dragPlane || !selected) return
    event.stopPropagation()
    ;(event.nativeEvent.target as Element | null)?.setPointerCapture?.(
      event.pointerId,
    )
    dragging.current = true
    moved.current = false

    activePlane.current.copy(planeThroughPoint(dragPlane, position))
    if (!event.ray.intersectPlane(activePlane.current, hitPoint.current)) return
    grabOffset.current.set(
      position.x - hitPoint.current.x,
      position.y - hitPoint.current.y,
      position.z - hitPoint.current.z,
    )
  }

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !selected) return
    event.stopPropagation()
    moved.current = true

    if (!event.ray.intersectPlane(activePlane.current, hitPoint.current)) return

    dispatch(
      updateObjectPosition({
        id: object.id,
        position: {
          x: hitPoint.current.x + grabOffset.current.x,
          y: hitPoint.current.y + grabOffset.current.y,
          z: hitPoint.current.z + grabOffset.current.z,
        },
      }),
    )
  }

  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    ;(event.nativeEvent.target as Element | null)?.releasePointerCapture?.(
      event.pointerId,
    )
  }

  const dragHandlers =
    dragPlane && selected
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
        }
      : {}

  const material = <meshStandardMaterial color={color} />

  if (type === 'sphere') {
    return (
      <mesh
        position={positionVec}
        rotation={rotationRad}
        scale={[size.x, size.y, size.z]}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...dragHandlers}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        {material}
        {selected ? <SelectionOutline shape="sphere" size={size} /> : null}
      </mesh>
    )
  }

  return (
    <group position={positionVec} rotation={rotationRad}>
      <mesh onClick={onClick} onContextMenu={onContextMenu} {...dragHandlers}>
        <boxGeometry args={[size.x, size.y, size.z]} />
        {material}
      </mesh>
      {selected ? <SelectionOutline shape="box" size={size} /> : null}
      {edgeEditing && edgeEdit && isBox ? (
        <EdgeHandles
          size={size}
          selectedEdge={edgeEdit.edge}
          onSelect={(edge) =>
            dispatch(
              sizeEdit ? setSizeEdge(edge) : setRotateEdge(edge),
            )
          }
        />
      ) : null}
    </group>
  )
}
