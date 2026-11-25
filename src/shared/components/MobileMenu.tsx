import type { useMobileMenu } from '@/shared/hooks/useMobileMenu'
import './mobile-menu.css'

export function MobileMenu({ menu, controls }: { menu: ReturnType<typeof useMobileMenu>; controls: string }) {
  return <header className="portal-mobile-header">
    <strong>Casa Andina</strong>
    <button type="button" aria-controls={controls} aria-expanded={menu.open}
      aria-label={menu.open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={menu.toggle}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d={menu.open ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'} />
      </svg><span>{menu.open ? 'Cerrar' : 'Menú'}</span>
    </button>
  </header>
}
