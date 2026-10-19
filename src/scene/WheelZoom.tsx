import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAppSelector } from '../store/hooks.ts'
import { aimCameraAtPivot, selectOrbitPivot } from './orbitPivot.ts'

type WheelZoomProps = {
  minDistance?: number
  maxDistance?: number
  sensitivity?: number
}

export function WheelZoom({
  minDistance = 1.2,
  maxDistance = 40,
  sensitivity = 0.0012,
}: WheelZoomProps) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const pivot = useAppSelector(selectOrbitPivot)
  const pivotRef = useRef(pivot)
  pivotRef.current = pivot

  useEffect(() => {
    const element = gl.domElement
    const offset = new Vector3()

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()

      const pivotNow = pivotRef.current
      const { x: px, y: py, z: pz } = pivotNow
      offset.set(
        camera.position.x - px,
        camera.position.y - py,
        camera.position.z - pz,
      )

      const distance = offset.length()
      if (distance < 1e-6) return

      const factor = Math.exp(event.deltaY * sensitivity)
      const nextDistance = Math.min(
        maxDistance,
        Math.max(minDistance, distance * factor),
      )

      offset.multiplyScalar(nextDistance / distance)
      camera.position.set(px + offset.x, py + offset.y, pz + offset.z)
      // Keep elevation locked at 20° after zoom along the ray.
      aimCameraAtPivot(camera, pivotNow)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [camera, gl, minDistance, maxDistance, sensitivity])

  return null
}
