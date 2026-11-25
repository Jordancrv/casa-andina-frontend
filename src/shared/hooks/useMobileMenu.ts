import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'

export function useMobileMenu() {
  const { pathname } = useLocation()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const close = () => setOpenPath(null)
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      close()
      event.currentTarget.querySelector<HTMLButtonElement>('.portal-mobile-header button')?.focus()
    }
  }
  return { open, close, onKeyDown, toggle: () => setOpenPath(open ? null : pathname) }
}

