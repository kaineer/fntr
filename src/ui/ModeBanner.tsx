import {
  clearAlign,
  clearDrag,
  clearInteractionModes,
  exitRotateEdit,
  exitSizeEdit,
} from '../store/objectsSlice.ts'
import { sizeEdgeLabel } from '../store/sizeEdge.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { useEffect } from 'react'

export function ModeBanner() {
  const dispatch = useAppDispatch()
  const dragPlane = useAppSelector((state) => state.objects.dragPlane)
  const align = useAppSelector((state) => state.objects.align)
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      if (!dragPlane && !align && !sizeEdit && !rotateEdit) return
      event.preventDefault()
      event.stopImmediatePropagation()
      dispatch(clearInteractionModes())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, dragPlane, align, sizeEdit, rotateEdit])

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

  if (align?.phase === 'pickSourceCorner') {
    return (
      <div className="mode-banner">
        Align — выберите вершину на объекте. Esc — отмена
        <button type="button" onClick={() => dispatch(clearAlign())}>
          Отмена
        </button>
      </div>
    )
  }

  if (align?.phase === 'pickTarget') {
    return (
      <div className="mode-banner">
        Align — кликните целевой параллелепипед. Esc — отмена
        <button type="button" onClick={() => dispatch(clearAlign())}>
          Отмена
        </button>
      </div>
    )
  }

  if (align?.phase === 'pickTargetCorner') {
    return (
      <div className="mode-banner">
        Align — выберите вершину на цели. Esc — отмена
        <button type="button" onClick={() => dispatch(clearAlign())}>
          Отмена
        </button>
      </div>
    )
  }

  if (sizeEdit) {
    return (
      <div className="mode-banner">
        Size {sizeEdgeLabel(sizeEdit.edge)} — клик по ребру, Space — размер.
        Esc — выход
        <button type="button" onClick={() => dispatch(exitSizeEdit())}>
          Готово
        </button>
      </div>
    )
  }

  if (rotateEdit) {
    return (
      <div className="mode-banner">
        Rotate {sizeEdgeLabel(rotateEdit.edge)} — ребро на любом боксе ·
        Shift+ЛКМ — ±90° · Space — форма. Esc — выход
        <button type="button" onClick={() => dispatch(exitRotateEdit())}>
          Готово
        </button>
      </div>
    )
  }

  return null
}
