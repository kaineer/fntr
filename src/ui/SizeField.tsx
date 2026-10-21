import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'

const FACTORS = [3, 10, 33, 100] as const
const MIN_SIZE = 0.001

type SizeFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function clampSize(value: number) {
  if (!Number.isFinite(value)) return MIN_SIZE
  return Math.max(MIN_SIZE, value)
}

function formatSize(value: number) {
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toFixed(6)))
}

function menuPosition(clientX: number, clientY: number) {
  const width = 132
  const height = 260
  const pad = 8
  return {
    x: Math.min(clientX, window.innerWidth - width - pad),
    y: Math.min(clientY, window.innerHeight - height - pad),
  }
}

export function SizeField({ label, value, onChange }: SizeFieldProps) {
  const inputId = useId()
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(formatSize(value))
  const [step, setStep] = useState(1)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  // Defer until after the Space keyup that opened the form, so the key
  // does not insert a character or activate a control.
  useEffect(() => {
    const focusInput = () => {
      const input = inputRef.current
      if (!input) return
      input.focus()
      input.select()
    }
    window.addEventListener('keyup', focusInput, { once: true })
    const fallback = window.setTimeout(focusInput, 50)
    return () => {
      window.removeEventListener('keyup', focusInput)
      window.clearTimeout(fallback)
    }
  }, [])

  useEffect(() => {
    if (!menu) return

    const close = () => setMenu(null)
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (menuRef.current?.contains(target)) return
      if (fieldRef.current?.contains(target)) return
      close()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const commit = (next: number) => {
    const clamped = clampSize(next)
    setDraft(formatSize(clamped))
    onChange(clamped)
  }

  const applyFactor = (factor: number, mode: 'mul' | 'div') => {
    const next = mode === 'mul' ? value * factor : value / factor
    const clamped = clampSize(next)
    setStep(clamped)
    commit(clamped)
    setMenu(null)
  }

  return (
    <div className="size-field" ref={fieldRef}>
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="decimal"
        value={focused ? draft : formatSize(value)}
        onFocus={() => {
          setFocused(true)
          setDraft(formatSize(value))
        }}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const parsed = Number(text.replace(',', '.'))
          if (text.trim() === '' || Number.isNaN(parsed) || parsed <= 0) return
          onChange(parsed)
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = Number(draft.replace(',', '.'))
          commit(Number.isNaN(parsed) ? value : parsed)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          setMenu(menuPosition(event.clientX, event.clientY))
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
          event.preventDefault()
          const delta = event.key === 'ArrowUp' ? step : -step
          commit(value + delta)
        }}
      />
      {menu ? (
        <SizeContextMenu
          menuRef={menuRef}
          x={menu.x}
          y={menu.y}
          onApply={applyFactor}
        />
      ) : null}
    </div>
  )
}

type SizeContextMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>
  x: number
  y: number
  onApply: (factor: number, mode: 'mul' | 'div') => void
}

function SizeContextMenu({ menuRef, x, y, onApply }: SizeContextMenuProps) {
  return createPortal(
    <div
      ref={menuRef}
      className="size-context-menu"
      style={{ left: x, top: y }}
      role="menu"
    >
      <div className="size-context-group">
        <span className="size-context-label">Вверх</span>
        {FACTORS.map((factor) => (
          <button
            key={`mul-${factor}`}
            type="button"
            role="menuitem"
            onClick={() => onApply(factor, 'mul')}
          >
            {'\u00d7'}
            {factor}
          </button>
        ))}
      </div>
      <div className="size-context-group">
        <span className="size-context-label">Вниз</span>
        {FACTORS.map((factor) => (
          <button
            key={`div-${factor}`}
            type="button"
            role="menuitem"
            onClick={() => onApply(factor, 'div')}
          >
            {'\u00f7'}
            {factor}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
