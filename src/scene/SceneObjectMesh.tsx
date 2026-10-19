import { useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { Plane, Vector3 } from 'three'
import {
  addToSelection,
  openObjectMenu,
  pickAlignSourceCorner,
  pickAlignTarget,
  pickAlignTargetCorner,
  selectObject,
  setRotateEdge,
  setSizeEdge,
  translateSelected,
  type SceneObject,
} from '../store/objectsSlice.ts'
import { primarySelectedId } from '../store/selection.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { CornerHandles } from './CornerHandles.tsx'
import { planeThroughPoint } from './dragPlane.ts'
import { EdgeHandles } from './EdgeHandles.tsx'
import { SelectionOutline } from './SelectionOutline.tsx'

type SceneObjectMeshProps = {
  object: SceneObject
}

export function SceneObjectMesh({ object }: SceneObjectMeshProps) {
  const dispatch = useAppDispatch()
  const selected = useAppSelector((state) =>
    state.objects.selectedIds.includes(object.id),
  )
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
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

  const primaryId = primarySelectedId(selectedIds)
  const isBox = type === 'cube' || type === 'box'
  // Size: edges on the single selected box. Rotate: edges on every selected box.
  const showSizeEdges = Boolean(
    sizeEdit && selected && primaryId === object.id && isBox,
  )
  const showRotateEdges = Boolean(rotateEdit && selected && isBox)
  const edgeEditing = showSizeEdges || showRotateEdges
  const activeEdge = showSizeEdges
    ? sizeEdit!.edge
    : showRotateEdges && rotateEdit!.edgeObjectId === object.id
      ? rotateEdit!.edge
      : null

  const showSourceCorners = Boolean(
    isBox &&
      selected &&
      primaryId === object.id &&
      (align?.phase === 'pickSourceCorner' || align?.phase === 'pickTarget'),
  )
  const showTargetCorners = Boolean(
    isBox &&
      align?.phase === 'pickTargetCorner' &&
      align.targetId === object.id,
  )
  const showCorners = showSourceCorners || showTargetCorners
  const activeAlignCorner =
    showSourceCorners && align?.phase === 'pickTarget'
      ? align.sourceCorner
      : null

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (moved.current) {
      moved.current = false
      return
    }

    if (align?.phase === 'pickSourceCorner') return
    if (align?.phase === 'pickTargetCorner') return

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

    // Shift+click adds to selection when something is already selected.
    if (event.nativeEvent.shiftKey && selectedIds.length > 0) {
      dispatch(addToSelection(object.id))
      return
    }

    // LMB selects only; context menu opens on RMB.
    dispatch(selectObject({ id: object.id, openMenu: false }))
  }

  const onContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    event.nativeEvent.preventDefault()

    if (align) return

    if (sizeEdit || rotateEdit || dragPlane) {
      dispatch(selectObject({ id: object.id, openMenu: false }))
      return
    }

    // RMB on already-selected object keeps multi-selection and opens menu.
    if (selected) {
      dispatch(openObjectMenu())
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

    const nextX = hitPoint.current.x + grabOffset.current.x
    const nextY = hitPoint.current.y + grabOffset.current.y
    const nextZ = hitPoint.current.z + grabOffset.current.z

    dispatch(
      translateSelected({
        delta: {
          x: nextX - position.x,
          y: nextY - position.y,
          z: nextZ - position.z,
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
      {edgeEditing ? (
        <EdgeHandles
          size={size}
          selectedEdge={activeEdge}
          previewInactive={Boolean(rotateEdit)}
          onSelect={(edge) =>
            dispatch(
              sizeEdit
                ? setSizeEdge(edge)
                : setRotateEdge({ edge, objectId: object.id }),
            )
          }
        />
      ) : null}
      {showCorners ? (
        <CornerHandles
          size={size}
          selectedCorner={activeAlignCorner}
          onSelect={(corner) =>
            dispatch(
              showSourceCorners
                ? pickAlignSourceCorner(corner)
                : pickAlignTargetCorner(corner),
            )
          }
        />
      ) : null}
    </group>
  )
}
