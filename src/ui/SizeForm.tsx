import type { Ref } from 'react'
import { updateObjectSize } from '../store/objectsSlice.ts'
import { sizeEdgeAxis, sizeEdgeLabel } from '../store/sizeEdge.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { SizeField } from './SizeField.tsx'

type SizeFormProps = {
  formRef: Ref<HTMLElement>
}

const AXIS_LABELS = {
  x: 'Ширина',
  y: 'Высота',
  z: 'Глубина',
} as const

export function SizeForm({ formRef }: SizeFormProps) {
  const dispatch = useAppDispatch()
  const sizeEdit = useAppSelector((state) => state.objects.sizeEdit)
  const selected = useAppSelector((state) =>
    state.objects.items.find((item) => item.id === state.objects.selectedId),
  )

  if (!sizeEdit?.formOpen || !selected) return null

  const axis = sizeEdgeAxis(sizeEdit.edge)
  const label = `${AXIS_LABELS[axis]} (${sizeEdgeLabel(sizeEdit.edge)})`

  return (
    <section
      ref={formRef}
      className="size-form size-form-overlay"
      aria-label="Размер ребра"
    >
      <h2>Размер</h2>
      <p className="size-form-hint">Esc — выход из режима</p>
      <div className="size-fields">
        <SizeField
          label={label}
          value={selected.size[axis]}
          onChange={(value) =>
            dispatch(
              updateObjectSize({
                id: selected.id,
                size: { [axis]: value },
              }),
            )
          }
        />
      </div>
    </section>
  )
}
