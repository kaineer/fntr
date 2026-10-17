import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppSelector } from '../store/hooks.ts'

type OrbitYProps = {
  sensitivity?: number
}

export function OrbitY({ sensitivity = 0.005 }: OrbitYProps) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const dragPlaneRef = useRef(dragPlane)
  dragPlaneRef.current = dragPlane

  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let lastX = 0

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || dragPlaneRef.current) return
      dragging = true
      lastX = event.clientX
      element.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return

      const dx = event.clientX - lastX
      lastX = event.clientX
      if (dx === 0) return

      const angle = -dx * sensitivity
      const { x, z } = camera.position
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      camera.position.x = x * cos + z * sin
      camera.position.z = -x * sin + z * cos
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }

    const endDrag = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
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
  }, [camera, gl, sensitivity])

  return null
}
