import { useRef } from 'react'
import { Scene } from './scene/Scene.tsx'
import { addToSelection, selectObject } from './store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from './store/hooks.ts'
import { CommandMenu } from './ui/CommandMenu.tsx'
import { ModeBanner } from './ui/ModeBanner.tsx'
import { RotateForm } from './ui/RotateForm.tsx'
import { SizeForm } from './ui/SizeForm.tsx'
import './App.css'

const typeLabels = {
  cube: 'Cube',
  box: 'Box',
  sphere: 'Sphere',
} as const

function App() {
  const dispatch = useAppDispatch()
  const objects = useAppSelector((state) => state.objects.items)
  const selectedIds = useAppSelector((state) => state.objects.selectedIds)
  const formRef = useRef<HTMLElement>(null)

  return (
    <div className="app">
      <aside className="panel">
        <h1>fntr</h1>
        <p>
          <kbd>Space</kbd> — Insert. ЛКМ — выбор, Shift+ЛКМ — добавить, ПКМ —
          меню. <kbd>G</kbd> — group, <kbd>Shift+G</kbd> — ungroup.{' '}
          <kbd>X</kbd>/<kbd>Y</kbd>/<kbd>P</kbd> — cut/yank/paste.
        </p>

        <section className="object-list">
          <h2>Объекты ({objects.length})</h2>
          {objects.length === 0 ? (
            <p className="empty">Сцена пуста</p>
          ) : (
            <ul>
              {objects.map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    className={
                      selectedIds.includes(object.id)
                        ? 'object-item selected'
                        : 'object-item'
                    }
                    onClick={(event) => {
                      if (event.shiftKey && selectedIds.length > 0) {
                        dispatch(addToSelection(object.id))
                        return
                      }
                      dispatch(selectObject({ id: object.id }))
                    }}
                  >
                    <strong>
                      {typeLabels[object.type]}
                      {object.groupId ? ' · g' : ''}
                    </strong>
                    <span>
                      size {object.size.x}×{object.size.y}×{object.size.z}
                    </span>
                    <span>
                      pos {object.position.x.toFixed(1)},{' '}
                      {object.position.y.toFixed(1)},{' '}
                      {object.position.z.toFixed(1)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
      <main className="viewport">
        <Scene overlayRef={formRef} />
        <SizeForm formRef={formRef} />
        <RotateForm formRef={formRef} />
        <ModeBanner />
        <CommandMenu />
      </main>
    </div>
  )
}

export default App
