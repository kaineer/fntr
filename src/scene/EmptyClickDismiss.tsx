import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { GridHelper } from 'three'
import { clearInteractionModes } from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

const CLICK_SLOP_PX = 5

/**
 * Tracks whether the current LMB gesture moved (orbit / drag).
 * Used by Canvas onPointerMissed to ignore empty-space clicks that were drags.
 */
let lastLmbMoved = false

export function wasLastLmbMoved() {
  return lastLmbMoved
}

export function EmptyClickTracker() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const element = gl.domElement
    let tracking = false
    let startX = 0
    let startY = 0

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      tracking = true
      lastLmbMoved = false
      startX = event.clientX
      startY = event.clientY
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!tracking || lastLmbMoved) return
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      if (Math.hypot(dx, dy) > CLICK_SLOP_PX) {
        lastLmbMoved = true
      }
    }

    const end = () => {
      tracking = false
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', end)
    element.addEventListener('pointercancel', end)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', end)
      element.removeEventListener('pointercancel', end)
    }
  }, [gl])

  return null
}

/** Disable raycasts on the grid so "empty" clicks over the floor count as misses. */
export function NonRaycastGrid({
  args,
}: {
  args: [number, number, string, string]
}) {
  const ref = useRef<GridHelper>(null)

  useEffect(() => {
    const grid = ref.current
    if (!grid) return
    grid.raycast = () => {}
  }, [])

  return <gridHelper ref={ref} args={args} />
}

export function useDismissOnEmptyClick() {
  const dispatch = useAppDispatch()
  const hasMode = useAppSelector(
    (state) =>
      Boolean(state.objects.moveEdit) ||
      Boolean(state.objects.align) ||
      Boolean(state.objects.sizeEdit) ||
      Boolean(state.objects.rotateEdit),
  )
  const hasModeRef = useRef(hasMode)
  hasModeRef.current = hasMode

  return (event: MouseEvent) => {
    if (event.button !== 0 || wasLastLmbMoved()) return
    // Shift+click on empty space must not change selection or modes.
    if (event.shiftKey) return
    if (!hasModeRef.current) return
    dispatch(clearInteractionModes())
  }
}
