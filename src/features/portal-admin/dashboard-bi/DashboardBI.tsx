/**
 * DashboardBI.tsx
 * ---------------------------------------------------------------------------
 * Sección "Resumen" del Panel Admin — Casa Andina.
 * Se monta dentro del layout existente (sidebar y header ya provistos por
 * el shell del portal-admin). Este componente ES solo el contenido interior.
 *
 * Arquitectura:
 *   useDashboard()         → Estado + carga paralela de datos (mock/backend)
 *   dashboard.service.ts   → Llamadas a los endpoints GET del backend
 *   components/            → Sub-componentes atómicos reutilizables
 *   DashboardBI.css        → Estilos BEM de este módulo (sin layout global)
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react'
import './DashboardBI.css'
import {
  useDashboard,
  formatSoles,
  calcVariacion,
  formatVariacion,
} from './useDashboard'
import type { DashboardFiltros } from '@/shared/types/global.types'
import { KPICard }        from './components/KPICard'
import { BarChart }       from './components/BarChart'
import { OcupacionList }  from './components/OcupacionList'
import { CancelacionList } from './components/CancelacionList'
import { ProyeccionGrid } from './components/ProyeccionGrid'
import { CanalesCard }    from './components/CanalesCard'
import { ChatbotCard }    from './components/ChatbotCard'

// ---------------------------------------------------------------------------
// Iconos SVG inline (sin emojis ni dependencias de icon-fonts)
// ---------------------------------------------------------------------------

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconCoin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 100 100"
    fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    {/* Edificio secundario (derecha) */}
    <path d="M60 92 V45 a7 7 0 0 1 7-7 h16 a7 7 0 0 1 7 7 v47 Z" />
    {/* Edificio principal (izquierda) */}
    <path d="M8 92 V25 a7 7 0 0 1 7-7 h38 a7 7 0 0 1 7 7 v67 Z" />
    
    {/* Ventanas — edificio principal (2 columnas × 3 filas) */}
    <circle cx="24" cy="36" r="4" fill="currentColor" stroke="none" />
    <circle cx="44" cy="36" r="4" fill="currentColor" stroke="none" />
    <circle cx="24" cy="52" r="4" fill="currentColor" stroke="none" />
    <circle cx="44" cy="52" r="4" fill="currentColor" stroke="none" />
    <circle cx="24" cy="68" r="4" fill="currentColor" stroke="none" />
    <circle cx="44" cy="68" r="4" fill="currentColor" stroke="none" />
    
    {/* Ventanas — edificio secundario (1 columna × 2 filas) */}
    <circle cx="75" cy="54" r="4" fill="currentColor" stroke="none" />
    <circle cx="75" cy="70" r="4" fill="currentColor" stroke="none" />
    
    {/* Puerta edificio principal */}
    <path d="M28 92 V80 a4 4 0 0 1 4-4 h4 a4 4 0 0 1 4 4 v12" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconWarn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <triangle points="12 2 22 21 2 21" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// ---------------------------------------------------------------------------
// FiltroBar — barra de filtros (período + sede)
// ---------------------------------------------------------------------------

interface FiltroBarProps {
  filtros: DashboardFiltros
  sedes: { id: number | null; label: string }[]
  onChangeFiltros: (f: DashboardFiltros) => void
}

function FiltroBar({ filtros, sedes, onChangeFiltros }: FiltroBarProps) {
  return (
    <div className="db-filtros" role="search" aria-label="Filtros del dashboard">
      <select
        id="db-select-periodo"
        className="db-filtros__select"
        value={filtros.periodo}
        onChange={(e) =>
          onChangeFiltros({ ...filtros, periodo: e.target.value as DashboardFiltros['periodo'] })
        }
        aria-label="Período de tiempo"
      >
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
        <option value="mes">Este mes</option>
      </select>

      <select
        id="db-select-sede"
        className="db-filtros__select"
        value={filtros.sedeId ?? ''}
        onChange={(e) =>
          onChangeFiltros({
            ...filtros,
            sedeId: e.target.value === '' ? null : Number(e.target.value),
          })
        }
        aria-label="Sede"
      >
        {sedes.map((s) => (
          <option key={s.id ?? 'todas'} value={s.id ?? ''}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardWrapper — envuelve cualquier bloque con cabecera uniforme
// ---------------------------------------------------------------------------

interface CardWrapperProps {
  titulo: string
  nota?: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function CardWrapper({ titulo, nota, badge, children, className = '' }: CardWrapperProps) {
  return (
    <div className={`db-card ${className}`}>
      <div className="db-card__head">
        <span className="db-card__title">{titulo}</span>
        {nota  && <span className="db-card__note">{nota}</span>}
        {badge && <span className="db-card__badge">{badge}</span>}
      </div>
      <div className="db-card__body">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeletons de carga
// ---------------------------------------------------------------------------

function SkeletonKpi() {
  return <div className="db-card db-kpi db-skeleton" aria-busy="true" aria-label="Cargando KPI…" />
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`db-card db-skeleton db-skeleton--tall ${className}`}
      aria-busy="true"
      aria-label="Cargando…"
    />
  )
}

// ---------------------------------------------------------------------------
// Listado estático de sedes para el selector
// En producción cargar desde GET /api/sedes
// ---------------------------------------------------------------------------

const SEDES_SELECTOR = [
  { id: null, label: 'Todas las sedes' },
  { id: 1,    label: 'Miraflores'      },
  { id: 2,    label: 'Cusco Plaza'     },
  { id: 3,    label: 'Arequipa'        },
  { id: 4,    label: 'Puno'            },
  { id: 5,    label: 'Piura'           },
  { id: 6,    label: 'Trujillo'        },
  { id: 7,    label: 'Tacna'           },
]

// ---------------------------------------------------------------------------
// Componente principal — solo contenido, sin layout propio
// ---------------------------------------------------------------------------

export const DashboardBI = () => {
  const { data, loading, error, filtros, setFiltros, refetch } = useDashboard()
  const [vistaReservas, setVistaReservas] = useState<'confirmadas' | 'canceladas'>('confirmadas')

  // KPIs calculados
  const varReservas  = data ? calcVariacion(data.kpis.totalReservas,      data.kpis.totalReservasPeriodoAnterior) : 0
  const varIngresos  = data ? calcVariacion(data.kpis.ingresosTotalSoles, data.kpis.ingresosPeriodoAnterior)      : 0
  const varOcupacion = data ? (data.kpis.ocupacionPromedioPct - data.kpis.ocupacionPeriodoAnterior)               : 0

  return (
    <div className="db-page">

      {/* ── Filtros + refresco ──────────────────────────────────────────── */}
      <div className="db-page__actions">
        <FiltroBar filtros={filtros} sedes={SEDES_SELECTOR} onChangeFiltros={setFiltros} />
        <button
          className="db-btn-refresh"
          onClick={refetch}
          disabled={loading}
          aria-label="Actualizar datos"
          title="Actualizar"
        >
          <IconRefresh />
        </button>
      </div>

      {/* ── Banner de error ──────────────────────────────────────────────── */}
      {error && (
        <div className="db-error" role="alert">
          <IconWarn />
          <span>{error}</span>
          <button className="db-error__btn" onClick={refetch}>Reintentar</button>
        </div>
      )}

      {/* ── Fila 1: KPIs ────────────────────────────────────────────────── */}
      <section className="db-kpis" aria-label="Indicadores principales">
        {loading ? (
          <><SkeletonKpi /><SkeletonKpi /><SkeletonKpi /><SkeletonKpi /></>
        ) : data ? (
          <>
            <KPICard
              label="Reservas"
              value={data.kpis.totalReservas.toLocaleString('es-PE')}
              variacion={`${formatVariacion(varReservas)} Vs. Periodo Anterior`}
              positivo={varReservas >= 0}
              icono={<IconCalendar />}
            />
            <KPICard
              label="Ingresos"
              value={formatSoles(data.kpis.ingresosTotalSoles)}
              variacion={`${formatVariacion(varIngresos)} Vs. Periodo Anterior`}
              positivo={varIngresos >= 0}
              icono={<IconCoin />}
            />
            <KPICard
              label="Ocupación Promedio"
              value={`${data.kpis.ocupacionPromedioPct.toFixed(1)}%`}
              variacion={`${varOcupacion >= 0 ? '↑' : '↓'} ${Math.abs(varOcupacion).toFixed(1)} pp Vs. Periodo Anterior`}
              positivo={varOcupacion >= 0}
              icono={<IconBuilding />}
            />
            <KPICard
              label="Clientes Activos"
              value={data.kpis.totalClientesActivos.toLocaleString('es-PE')}
              variacion={`↑ ${data.kpis.nuevosClientesPct.toFixed(1)}% Nuevos Clientes`}
              positivo={true}
              icono={<IconUsers />}
            />
          </>
        ) : null}
      </section>

      {/* ── Fila 2: Barras de reservas + Ocupación por sede ─────────────── */}
      <section className="db-grid-2" aria-label="Reservas y ocupación">
        {loading ? (
          <><SkeletonCard className="db-grid-2__main" /><SkeletonCard /></>
        ) : data ? (
          <>
            <CardWrapper titulo="Reservas Por Semana" nota="Últimas 6 Semanas" className="db-grid-2__main">
              <BarChart 
                series={data.reservasSemana} 
                onSelectType={setVistaReservas} 
                activeType={vistaReservas}
              />
            </CardWrapper>
            
            <CardWrapper 
              titulo={vistaReservas === 'confirmadas' ? "Ocupación Por Sede" : "Motivos De Cancelación"} 
              nota={vistaReservas === 'confirmadas' ? "Actual" : "Periodo"}
            >
              {/* Contenido dinámico controlado por el gráfico de barras */}
              {vistaReservas === 'confirmadas' ? (
                <OcupacionList sedes={data.ocupacionSedes} />
              ) : (
                <CancelacionList motivos={data.cancelacionesMotivos} />
              )}
            </CardWrapper>
          </>
        ) : null}
      </section>

      {/* ── Fila 3: Proyección de demanda ───────────────────────────────── */}
      <section aria-label="Proyección de demanda">
        {loading ? (
          <SkeletonCard />
        ) : data ? (
          <CardWrapper titulo="Proyección De Demanda" nota="Próximas 4 Semanas · Estimación">
            <ProyeccionGrid semanas={data.proyeccion} />
          </CardWrapper>
        ) : null}
      </section>

      {/* ── Fila 4: Canal de reservas + Asistente IA ────────────────────── */}
      <section className="db-grid-2" aria-label="Canal y asistente IA">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : data ? (
          <>
            <CardWrapper titulo="Canal De Reservas" nota="Periodo Seleccionado">
              <CanalesCard canales={data.canales} />
            </CardWrapper>
            <CardWrapper
              titulo="Asistente IA"
              badge={<span className="db-badge db-badge--activo">ACTIVO</span>}
            >
              <ChatbotCard metricas={data.chatbot} />
            </CardWrapper>
          </>
        ) : null}
      </section>

    </div>
  )
}