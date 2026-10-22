import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Sends keyboard and screen reader focus to the new screen after navigation. */
export function FocusOnNavigation() {
  const { pathname } = useLocation()

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1')
    if (!heading) return
    heading.tabIndex = -1
    heading.focus()
  }, [pathname])

  return null
}
