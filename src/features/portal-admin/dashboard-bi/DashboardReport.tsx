import { useAccess } from '@/app/providers/access-context'
import { useEffect, useRef, useState } from 'react'
import { PdfDialog } from '@/shared/ui/PdfDialog'
import type { DashboardFiltros } from '@/shared/types/global.types'
import { getDashboardReport } from './dashboard-report.api'

type Periodo = DashboardFiltros['periodo']
const labels: Record<Periodo, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', mes: 'Este mes' }

export function DashboardReport({ periodo, disabled }: { periodo: Periodo; disabled: boolean }) {
  const { can } = useAccess()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Periodo>(periodo)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resource = useRef<{ url: string | null; controller: AbortController | null }>({ url: null, controller: null })
  useEffect(() => {
    const current = resource.current
    return () => { current.controller?.abort(); if (current.url) URL.revokeObjectURL(current.url) }
  }, [])
  const generate = async (value: Periodo) => {
    resource.current.controller?.abort()
    if (resource.current.url) URL.revokeObjectURL(resource.current.url)
    resource.current.url = null
    const controller = new AbortController()
    resource.current.controller = controller
    setUrl(null); setSelected(value); setError(null); setLoading(true); setOpen(true)
    try {
      const blob = await getDashboardReport(value, controller.signal)
      if (controller.signal.aborted) return
      const objectUrl = URL.createObjectURL(blob)
      resource.current.url = objectUrl
      setUrl(objectUrl)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo generar el reporte. Vuelve a intentarlo.')
    } finally {
      if (!controller.signal.aborted) { setLoading(false); resource.current.controller = null }
    }
  }
  const close = () => {
    resource.current.controller?.abort(); resource.current.controller = null
    if (resource.current.url) URL.revokeObjectURL(resource.current.url)
    resource.current.url = null
    setUrl(null); setLoading(false); setOpen(false)
  }
  const download = () => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url; link.download = `Reporte-CasaAndina-${selected}.pdf`
    document.body.appendChild(link); link.click(); link.remove()
  }
  return <>
    <button className="db-btn-report" type="button" disabled={disabled || loading || !can("reportes.exportar")} onClick={() => void generate(periodo)}>{loading ? 'Generando reporte…' : 'Generar reporte ↗'}</button>
    {open && <PdfDialog url={url} title="Reporte del dashboard" eyebrow={`RESUMEN OPERATIVO · ${labels[selected].toUpperCase()}`} footer="Datos actualizados al generar · sede asignada · importe reservado no equivale a pagos aprobados." loading={loading} error={error} onClose={close} onRetry={() => void generate(selected)} onDownload={download} />}
  </>
}
