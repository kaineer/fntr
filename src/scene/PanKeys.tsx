import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppSelector } from '../store/hooks.ts'
import {
  getOrbitPivot,
  panOrbitPivot,
} from './orbitPivot.ts'

const PAN_SPEED = 1.4

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

/**
 * WASD pans the viewpoint (camera + orbit pivot together).
 * A/D — left/right in the view plane; W/S — world up/down.
 */
export function PanKeys() {
  const camera = useThree((state) => state.camera)
  const menuOpen = useAppSelector((state) => state.objects.commandMenu.open)
  const pressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  })

  useEffect(() => {
    if (menuOpen) {
      pressed.current.w = false
      pressed.current.a = false
      pressed.current.s = false
      pressed.current.d = false
    }
  }, [menuOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (menuOpen) return

      switch (event.code) {
        case 'KeyW':
          pressed.current.w = true
          event.preventDefault()
          break
        case 'KeyA':
          pressed.current.a = true
          event.preventDefault()
          break
        case 'KeyS':
          pressed.current.s = true
          event.preventDefault()
          break
        case 'KeyD':
          pressed.current.d = true
          event.preventDefault()
          break
        default:
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          pressed.current.w = false
          break
        case 'KeyA':
          pressed.current.a = false
          break
        case 'KeyS':
          pressed.current.s = false
          break
        case 'KeyD':
          pressed.current.d = false
          break
        default:
          break
      }
    }

    const clearAll = () => {
      pressed.current.w = false
      pressed.current.a = false
      pressed.current.s = false
      pressed.current.d = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearAll)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearAll)
    }
  }, [menuOpen])

  useFrame((_, delta) => {
    const keys = pressed.current
    const xAxis = (keys.d ? 1 : 0) - (keys.a ? 1 : 0)
    const yAxis = (keys.w ? 1 : 0) - (keys.s ? 1 : 0)
    if (xAxis === 0 && yAxis === 0) return

    const pivot = getOrbitPivot()
    const fx = pivot.x - camera.position.x
    const fz = pivot.z - camera.position.z
    const horizontal = Math.hypot(fx, fz)
    if (horizontal < 1e-6 && xAxis !== 0) return

    // Step scales with distance so pan feels even at any zoom.
    const step = PAN_SPEED * Math.max(horizontal, 1) * delta

    let dx = 0
    let dy = 0
    let dz = 0

    if (xAxis !== 0) {
      // Screen-right in XZ: forward × world-up
      const rx = -fz / horizontal
      const rz = fx / horizontal
      dx += rx * xAxis * step
      dz += rz * xAxis * step
    }

    if (yAxis !== 0) {
      dy += yAxis * step
    }

    panOrbitPivot(dx, dy, dz)
    camera.position.x += dx
    camera.position.y += dy
    camera.position.z += dz
    const next = getOrbitPivot()
    camera.lookAt(next.x, next.y, next.z)
  })

  return null
}
