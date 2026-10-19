import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppSelector } from '../store/hooks.ts'
import { aimCameraAtPivot, selectOrbitPivot } from './orbitPivot.ts'

type OrbitYProps = {
  sensitivity?: number
}

export function OrbitY({ sensitivity = 0.005 }: OrbitYProps) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selectedKey = useAppSelector((state) =>
    state.objects.selectedIds.join(','),
  )
  const pivot = useAppSelector(selectOrbitPivot)

  const dragPlaneRef = useRef(dragPlane)
  const rotateEditRef = useRef(rotateEdit)
  const pivotRef = useRef(pivot)
  dragPlaneRef.current = dragPlane
  rotateEditRef.current = rotateEdit
  pivotRef.current = pivot

  // When selection changes, re-aim at 20° toward the new pivot.
  useEffect(() => {
    aimCameraAtPivot(camera, pivotRef.current)
  }, [camera, selectedKey])

  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let lastX = 0

    const onContextMenu = (event: Event) => {
      event.preventDefault()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || dragPlaneRef.current) return
      dragging = true
      lastX = event.clientX
      element.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return
      // Shift+drag (form closed) rotates the object around the edge axis.
      const edit = rotateEditRef.current
      if (edit && !edit.formOpen && event.shiftKey) {
        lastX = event.clientX
        return
      }

      const dx = event.clientX - lastX
      lastX = event.clientX
      if (dx === 0) return

      const angle = -dx * sensitivity
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const pivotNow = pivotRef.current
      const rx = camera.position.x - pivotNow.x
      const rz = camera.position.z - pivotNow.z

      camera.position.x = pivotNow.x + rx * cos + rz * sin
      camera.position.z = pivotNow.z - rx * sin + rz * cos
      aimCameraAtPivot(camera, pivotNow)
    }

    const endDrag = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }

    element.addEventListener('contextmenu', onContextMenu)
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', endDrag)
    element.addEventListener('pointercancel', endDrag)

    return () => {
      element.removeEventListener('contextmenu', onContextMenu)
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', endDrag)
      element.removeEventListener('pointercancel', endDrag)
    }
  }, [camera, gl, sensitivity])

  return null
}
