import { useEffect, type Ref } from 'react'
import { closeSizeForm, updateObjectSize } from '../store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { SizeField } from './SizeField.tsx'

type SizeFormProps = {
  formRef: Ref<HTMLElement>
}

export function SizeForm({ formRef }: SizeFormProps) {
  const dispatch = useAppDispatch()
  const sizeFormOpen = useAppSelector((state) => state.objects.sizeFormOpen)
  const selected = useAppSelector((state) =>
    state.objects.items.find((item) => item.id === state.objects.selectedId),
  )

  useEffect(() => {
    if (!sizeFormOpen || !selected) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      event.preventDefault()
      dispatch(closeSizeForm())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sizeFormOpen, selected, dispatch])

  if (!sizeFormOpen || !selected) return null

  const setAxis = (axis: 'x' | 'y' | 'z', value: number) => {
    dispatch(updateObjectSize({ id: selected.id, size: { [axis]: value } }))
  }

  return (
    <section
      ref={formRef}
      className="size-form size-form-overlay"
      aria-label="Размеры объекта"
    >
      <h2>Размеры</h2>
      <p className="size-form-hint">Esc — закрыть</p>
      <div className="size-fields">
        <SizeField
          label="Ширина"
          value={selected.size.x}
          onChange={(value) => setAxis('x', value)}
        />
        <SizeField
          label="Высота"
          value={selected.size.y}
          onChange={(value) => setAxis('y', value)}
        />
        <SizeField
          label="Глубина"
          value={selected.size.z}
          onChange={(value) => setAxis('z', value)}
        />
      </div>
    </section>
  )
}
