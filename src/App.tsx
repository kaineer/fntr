import { useRef } from 'react'
import { Scene } from './scene/Scene.tsx'
import { selectObject } from './store/objectsSlice.ts'
import { useAppDispatch, useAppSelector } from './store/hooks.ts'
import { CommandMenu } from './ui/CommandMenu.tsx'
import { ModeBanner } from './ui/ModeBanner.tsx'
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
  const selectedId = useAppSelector((state) => state.objects.selectedId)
  const formRef = useRef<HTMLElement>(null)

  return (
    <div className="app">
      <aside className="panel">
        <h1>fntr</h1>
        <p>
          <kbd>Space</kbd> — Insert. Клик по объекту — Size / Move / Align /
          Rotate.
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
                      object.id === selectedId
                        ? 'object-item selected'
                        : 'object-item'
                    }
                    onClick={() =>
                      dispatch(selectObject({ id: object.id }))
                    }
                  >
                    <strong>{typeLabels[object.type]}</strong>
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
        <ModeBanner />
        <CommandMenu />
      </main>
    </div>
  )
}

export default App
