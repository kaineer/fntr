import { useEffect, useRef } from 'react'
import { type ThreeEvent, useThree } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'
import {
  addToSelection,
  openObjectMenu,
  pickAlignSourceCorner,
  pickAlignTarget,
  pickAlignTargetCorner,
  selectObject,
  setMoveAxis,
  setRotateEdge,
  setSizeEdge,
  translateSelected,
  type SceneObject,
  type Vec3,
} from '../store/objectsSlice.ts'
import type { MoveAxis } from '../store/moveAxis.ts'
import { primarySelectedId } from '../store/selection.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { AxisHandles } from './AxisHandles.tsx'
import { CornerHandles } from './CornerHandles.tsx'
import { rayClosestAxisT } from './dragPlane.ts'
import { EdgeHandles } from './EdgeHandles.tsx'
import { SelectionOutline } from './SelectionOutline.tsx'

type SceneObjectMeshProps = {
  object: SceneObject
}

export function SceneObjectMesh({ object }: SceneObjectMeshProps) {
  const dispatch = useAppDispatch()
  const { camera, gl } = useThree()
  const selected = useAppSelector((state) =>
    state.objects.selectedIds.includes(object.id),
  )
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
  const moveEdit = useAppSelector((state) => state.objects.moveEdit)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const dragging = useRef(false)
  const moved = useRef(false)
  const dragAxis = useRef<MoveAxis>('x')
  const grabT = useRef(0)
  const axisOrigin = useRef<Vec3>({ x: 0, y: 0, z: 0 })
  const positionRef = useRef(object.position)
  const ndc = useRef(new Vector2())
  const raycaster = useRef(new Raycaster())
  const dragListeners = useRef<{
    move: (event: PointerEvent) => void
    up: (event: PointerEvent) => void
  } | null>(null)

  const { size, rotation, type, color, position } = object
  positionRef.current = position
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
  const isCube = type === 'cube'
  // Size: edges on the single selected cube. Rotate: edges on every selected cube.
  const showSizeEdges = Boolean(
    sizeEdit && selected && primaryId === object.id && isCube,
  )
  const showRotateEdges = Boolean(rotateEdit && selected && isCube)
  const edgeEditing = showSizeEdges || showRotateEdges
  const activeEdge = showSizeEdges
    ? sizeEdit!.edge
    : showRotateEdges && rotateEdit!.edgeObjectId === object.id
      ? rotateEdit!.edge
      : null

  // World-aligned move axes on the primary selected object (any type).
  const showMoveAxes = Boolean(
    moveEdit && selected && primaryId === object.id,
  )

  const showSourceCorners = Boolean(
    isCube &&
      selected &&
      primaryId === object.id &&
      (align?.phase === 'pickSourceCorner' || align?.phase === 'pickTarget'),
  )
  const showTargetCorners = Boolean(
    isCube &&
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

    if (sizeEdit || rotateEdit || moveEdit) {
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

    if (sizeEdit || rotateEdit || moveEdit) {
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

  useEffect(() => {
    return () => {
      const listeners = dragListeners.current
      if (!listeners) return
      const element = gl.domElement
      element.removeEventListener('pointermove', listeners.move)
      element.removeEventListener('pointerup', listeners.up)
      element.removeEventListener('pointercancel', listeners.up)
      dragListeners.current = null
    }
  }, [gl])

  const applyAxisDrag = (clientX: number, clientY: number) => {
    const element = gl.domElement
    const rect = element.getBoundingClientRect()
    ndc.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
    ndc.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(ndc.current, camera)

    const axis = dragAxis.current
    const t = rayClosestAxisT(
      raycaster.current.ray.origin,
      raycaster.current.ray.direction,
      axisOrigin.current,
      axis,
    )
    const desired = axisOrigin.current[axis] + (t - grabT.current)
    const deltaAlong = desired - positionRef.current[axis]
    if (deltaAlong === 0) return

    dispatch(
      translateSelected({
        delta: {
          x: axis === 'x' ? deltaAlong : 0,
          y: axis === 'y' ? deltaAlong : 0,
          z: axis === 'z' ? deltaAlong : 0,
        },
      }),
    )
  }

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!moveEdit || !selected || event.nativeEvent.button !== 0) return
    event.stopPropagation()

    const axis = moveEdit.axis
    dragAxis.current = axis
    axisOrigin.current = {
      x: position.x,
      y: position.y,
      z: position.z,
    }
    grabT.current = rayClosestAxisT(
      event.ray.origin,
      event.ray.direction,
      axisOrigin.current,
      axis,
    )

    dragging.current = true
    moved.current = false

    const element = gl.domElement
    const previous = dragListeners.current
    if (previous) {
      element.removeEventListener('pointermove', previous.move)
      element.removeEventListener('pointerup', previous.up)
      element.removeEventListener('pointercancel', previous.up)
      dragListeners.current = null
    }

    element.setPointerCapture(event.nativeEvent.pointerId)

    const onMove = (native: PointerEvent) => {
      if (!dragging.current) return
      moved.current = true
      applyAxisDrag(native.clientX, native.clientY)
    }

    const onUp = (native: PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      if (element.hasPointerCapture(native.pointerId)) {
        element.releasePointerCapture(native.pointerId)
      }
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      dragListeners.current = null
    }

    dragListeners.current = { move: onMove, up: onUp }
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', onUp)
  }

  const dragHandlers =
    moveEdit && selected
      ? {
          onPointerDown,
        }
      : {}

  const material = <meshStandardMaterial color={color} />

  const moveAxisOverlay = showMoveAxes ? (
    <AxisHandles
      position={position}
      rotation={rotation}
      size={size}
      selectedAxis={moveEdit!.axis}
      onSelect={(axis) => dispatch(setMoveAxis(axis))}
    />
  ) : null

  if (type === 'sphere') {
    return (
      <>
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
        {moveAxisOverlay}
      </>
    )
  }

  return (
    <>
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
      {moveAxisOverlay}
    </>
  )
}
