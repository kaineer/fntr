import type { Ref } from 'react'
import { rotateObjectAroundEdge } from '../store/objectsSlice.ts'
import { sizeEdgeLabel } from '../store/sizeEdge.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'

type RotateFormProps = {
  formRef: Ref<HTMLElement>
}

const ACTIONS: { id: string; label: string; degrees: -90 | 90 | 180 }[] = [
  { id: 'minus90', label: '−90°', degrees: -90 },
  { id: 'plus90', label: '+90°', degrees: 90 },
  { id: 'plus180', label: '180°', degrees: 180 },
]

export function RotateForm({ formRef }: RotateFormProps) {
  const dispatch = useAppDispatch()
  const rotateEdit = useAppSelector((state) => state.objects.rotateEdit)
  const selected = useAppSelector((state) => {
    const ids = state.objects.selectedIds
    const primary = ids.length > 0 ? ids[ids.length - 1] : null
    return state.objects.items.find((item) => item.id === primary)
  })

  if (!rotateEdit?.formOpen || !selected) return null

  return (
    <section
      ref={formRef}
      className="size-form size-form-overlay"
      aria-label="Поворот вокруг ребра"
    >
      <h2>Поворот</h2>
      <p className="size-form-hint">
        {sizeEdgeLabel(rotateEdit.edge)} · Esc — выход
      </p>
      <div className="rotate-actions">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() =>
              dispatch(
                rotateObjectAroundEdge({
                  id: selected.id,
                  edge: rotateEdit.edge,
                  degrees: action.degrees,
                }),
              )
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  )
}
