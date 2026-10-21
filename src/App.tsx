import { useRef, useState } from 'react'
import { Scene } from './scene/Scene.tsx'
import { useAppSelector } from './store/hooks.ts'
import { CommandMenu } from './ui/CommandMenu.tsx'
import { ModeBanner } from './ui/ModeBanner.tsx'
import { ObjectList } from './ui/ObjectList.tsx'
import { RotateForm } from './ui/RotateForm.tsx'
import { SizeForm } from './ui/SizeForm.tsx'
import './App.css'

const PANEL_COLLAPSED_KEY = 'fntr.panelCollapsed'

function readPanelCollapsed(): boolean {
  try {
    return localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function writePanelCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(PANEL_COLLAPSED_KEY, String(collapsed))
  } catch {
    // ignore quota / private mode errors
  }
}

function App() {
  const objects = useAppSelector((state) => state.objects.items)
  const formRef = useRef<HTMLElement>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(readPanelCollapsed)

  const togglePanel = () => {
    setPanelCollapsed((value) => {
      const next = !value
      writePanelCollapsed(next)
      return next
    })
  }

  return (
    <div className={panelCollapsed ? 'app panel-collapsed' : 'app'}>
      <aside className={panelCollapsed ? 'panel collapsed' : 'panel'}>
        <div className="panel-header">
          {panelCollapsed ? null : <h1>fntr</h1>}
          <button
            type="button"
            className="panel-toggle"
            aria-label={
              panelCollapsed ? 'Развернуть панель' : 'Свернуть панель'
            }
            aria-expanded={!panelCollapsed}
            title={panelCollapsed ? 'Развернуть' : 'Свернуть'}
            onClick={togglePanel}
          >
            {panelCollapsed ? '›' : '‹'}
          </button>
        </div>

        {panelCollapsed ? null : (
          <>
            <p>
              <kbd>Space</kbd> — меню (буквы пунктов). <kbd>I</kbd> — Insert,
              <kbd>IC</kbd>/<kbd>IS</kbd> — cube/sphere. ЛКМ — выбор,
              Shift+ЛКМ — добавить, ПКМ — меню. <kbd>WASD</kbd> — сдвиг вида.{' '}
              <kbd>G</kbd> — group, <kbd>Shift+G</kbd> — ungroup.{' '}
              <kbd>X</kbd>/<kbd>Y</kbd>/<kbd>P</kbd> — cut/yank/paste.
            </p>

            <section className="object-list">
              <h2>Объекты ({objects.length})</h2>
              <ObjectList />
            </section>
          </>
        )}
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
