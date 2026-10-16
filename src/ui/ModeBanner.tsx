import {
  clearAlign,
  clearDrag,
  clearInteractionModes,
} from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { useEffect } from 'react'

export function ModeBanner() {
  const dispatch = useAppDispatch()
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const align = useAppSelector((state) => state.objects.align)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      if (!dragPlane && !align) return
      if (align?.phase === 'pickTargetCorner') return
      event.preventDefault()
      event.stopImmediatePropagation()
      dispatch(clearInteractionModes())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, dragPlane, align])

  useEffect(() => {
    if (!dragPlane) return
    const previous = document.body.style.cursor
    document.body.style.cursor = 'grab'
    return () => {
      document.body.style.cursor = previous
    }
  }, [dragPlane])

  if (dragPlane) {
    return (
      <div className="mode-banner">
        Move {dragPlane.toUpperCase()} — тяните объект. Esc — выход
        <button type="button" onClick={() => dispatch(clearDrag())}>
          Готово
        </button>
      </div>
    )
  }

  if (align?.phase === 'pickTarget') {
    return (
      <div className="mode-banner">
        Align {align.sourceCorner} — кликните целевой объект. Esc — отмена
        <button type="button" onClick={() => dispatch(clearAlign())}>
          Отмена
        </button>
      </div>
    )
  }

  return null
}
