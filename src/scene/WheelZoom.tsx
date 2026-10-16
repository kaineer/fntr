import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

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

  useEffect(() => {
    const element = gl.domElement

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()

      const factor = Math.exp(event.deltaY * sensitivity)
      const nextDistance = Math.min(
        maxDistance,
        Math.max(minDistance, camera.position.length() * factor),
      )

      camera.position.setLength(nextDistance)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [camera, gl, minDistance, maxDistance, sensitivity])

  return null
}
