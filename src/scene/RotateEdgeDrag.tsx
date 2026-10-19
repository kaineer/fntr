import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { rotateObjectAroundEdge } from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type RotateEdgeDragProps = {
  /** Horizontal pixels of drag per discrete 90° step while Shift is held. */
  stepPixels?: number
}

export function RotateEdgeDrag({ stepPixels = 72 }: RotateEdgeDragProps) {
  const gl = useThree((state) => state.gl)
  const dispatch = useAppDispatch()
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selectedId = useAppSelector((state) => state.objects.selectedId)
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)

  const rotateEditRef = useRef(rotateEdit)
  const selectedIdRef = useRef(selectedId)
  const dragPlaneRef = useRef(dragPlane)
  rotateEditRef.current = rotateEdit
  selectedIdRef.current = selectedId
  dragPlaneRef.current = dragPlane

  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let lastX = 0
    let accumX = 0

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || dragPlaneRef.current) return
      const edit = rotateEditRef.current
      // Mouse rotate is for when the Space form is closed.
      if (!edit || edit.formOpen || !selectedIdRef.current) return
      dragging = true
      lastX = event.clientX
      accumX = 0
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !event.shiftKey) return

      const edit = rotateEditRef.current
      const id = selectedIdRef.current
      if (!edit || edit.formOpen || !id) return

      const dx = event.clientX - lastX
      lastX = event.clientX
      if (dx === 0) return

      // Accumulate drag; every stepPixels of motion → ±90° around the edge axis.
      accumX += dx
      while (Math.abs(accumX) >= stepPixels) {
        const degrees = accumX > 0 ? 90 : -90
        accumX -= Math.sign(accumX) * stepPixels
        dispatch(
          rotateObjectAroundEdge({
            id,
            edge: edit.edge,
            degrees,
          }),
        )
      }
    }

    const endDrag = () => {
      dragging = false
      accumX = 0
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', endDrag)
    element.addEventListener('pointercancel', endDrag)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', endDrag)
      element.removeEventListener('pointercancel', endDrag)
    }
  }, [dispatch, gl, stepPixels])

  return null
}
