import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { SceneObject } from '../store/objectsSlice.ts'
import { useAppSelector } from '../store/hooks.ts'

type OverlayTrackerProps = {
  overlayRef: RefObject<HTMLElement | null>
}

export function OverlayTracker({ overlayRef }: OverlayTrackerProps) {
  const selected = useAppSelector((state) =>
    state.objects.items.find((item) => item.id === state.objects.selectedId),
  )
  const selectedRef = useRef<SceneObject | undefined>(selected)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  const point = useRef(new Vector3())
  const size = useThree((state) => state.size)

  useFrame(({ camera }) => {
    const element = overlayRef.current
    const object = selectedRef.current
    if (!element) return

    if (!object) {
      element.style.visibility = 'hidden'
      return
    }

    point.current.set(0, object.size.y / 2, 0)
    point.current.project(camera)

    if (point.current.z > 1) {
      element.style.visibility = 'hidden'
      return
    }

    const x = (point.current.x * 0.5 + 0.5) * size.width
    const y = (-point.current.y * 0.5 + 0.5) * size.height

    element.style.visibility = 'visible'
    element.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 16px))`
  })

  return null
}
