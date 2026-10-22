import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface HoldButtonProps {
  onComplete: () => void
  /** Hold time. 1.5s in both Figma designs. */
  durationMs?: number
  label: string
  children?: ReactNode
  disabled?: boolean
  size?: number
}

/**
 * Press-and-hold confirm (A8 Lock in loadout, B7 Seal the loan).
 * Works with pointer, Space or Enter. A ring shows progress; releasing early cancels.
 */
export function HoldButton({ onComplete, durationMs = 1500, label, children, disabled, size = 168 }: HoldButtonProps) {
  const [progress, setProgress] = useState(0)
  const start = useRef<number | null>(null)
  const frame = useRef(0)
  const done = useRef(false)

  const tick = () => {
    if (start.current === null) return
    const p = Math.min(1, (performance.now() - start.current) / durationMs)
    setProgress(p)
    if (p >= 1) {
      start.current = null
      if (!done.current) {
        done.current = true
        onComplete()
      }
      return
    }
    frame.current = requestAnimationFrame(tick)
  }

  const begin = () => {
    if (disabled || start.current !== null || done.current) return
    start.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }

  const cancel = () => {
    if (done.current) return
    start.current = null
    cancelAnimationFrame(frame.current)
    setProgress(0)
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const r = size / 2 - 8
  const c = 2 * Math.PI * r

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          if (!done.current && !disabled) {
            done.current = true
            setProgress(1)
            onComplete()
          }
        }
      }}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && cancel()}
      onContextMenu={(e) => e.preventDefault()}
      className="relative grid touch-none select-none place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-50"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-reward)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <span className="relative font-display text-xl font-bold">{children ?? 'Hold'}</span>
      <span className="sr-only" aria-live="polite">
        {progress >= 1 ? 'Done' : ''}
      </span>
    </button>
  )
}
