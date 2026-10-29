import { useAccess } from '@/app/providers/access-context'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'
import { PdfDialog } from '@/shared/ui/PdfDialog'
import type { DashboardFiltros } from '@/shared/types/global.types'
import { useDashboard, formatSoles, type DashboardBi } from '../dashboard-bi/useDashboard'
import '../modulos-pendientes.css'
import './reportes.css'

type Periodo = DashboardFiltros['periodo']
interface Analisis { id: number; resumen: string; hallazgos: string; recomendaciones: string; limitaciones: string; generadoUtc: string; datos: DashboardBi }

export function Reportes() {
  const { can } = useAccess()
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const { data, loading, error, refetch } = useDashboard(periodo)
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [historyOpen, setHistoryOpen] = useState(false)
  const historyDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = historyDialog.current; if (historyOpen && dialog && !dialog.open) dialog.showModal(); return () => { if (dialog?.open) dialog.close() } }, [historyOpen])
  const [selected, setSelected] = useState<Analisis | null>(null)
  const history = useQuery({ queryKey: ['reportes-historial', usuario?.token, periodo, page], enabled: historyOpen, queryFn: async () => await api.get('/reportes/analisis', { params: { periodo, pagina: page } }) as unknown as { items: { id: number; generadoUtc: string }[]; haySiguiente: boolean } })
  const detail = useMutation({ mutationFn: async (id: number) => await api.get('/reportes/analisis/' + id) as unknown as Analisis, onSuccess: result => { setSelected(result); setHistoryOpen(false) } })
  const analysis = useMutation({ mutationFn: async (selected: Periodo) => await api.post('/reportes/analisis', null, { params: { periodo: selected } }) as unknown as Analisis, onSuccess: result => { setSelected(result); setPage(1); void queryClient.invalidateQueries({ queryKey: ['reportes-historial'] }) } })
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const pdfResource = useRef<{ url: string | null; controller: AbortController | null }>({ url: null, controller: null })
  useEffect(() => { const resource = pdfResource.current; return () => { resource.controller?.abort(); if (resource.url) URL.revokeObjectURL(resource.url) } }, [])
  const closePdf = () => { const resource = pdfResource.current; resource.controller?.abort(); resource.controller = null; if (resource.url) URL.revokeObjectURL(resource.url); resource.url = null; setPdfUrl(null); setPdfOpen(false); setPdfLoading(false) }
  const generatePdf = async () => {
    if (!selected) return
    const resource = pdfResource.current
    resource.controller?.abort(); if (resource.url) URL.revokeObjectURL(resource.url)
    resource.url = null; const controller = new AbortController(); resource.controller = controller
    setPdfUrl(null); setPdfOpen(true); setPdfLoading(true); setPdfError(null)
    try {
      const blob = await api.get<Blob, Blob>('/reportes/analisis/' + selected.id + '/pdf', { responseType: 'blob', signal: controller.signal })
      if (controller.signal.aborted) return
      if (!blob.type.includes('application/pdf') || await blob.slice(0, 5).text() !== '%PDF-') throw new Error('El servidor no devolvió un PDF válido.')
      resource.url = URL.createObjectURL(blob); setPdfUrl(resource.url)
    } catch { if (!controller.signal.aborted) setPdfError('No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.') }
    finally { if (!controller.signal.aborted) { setPdfLoading(false); resource.controller = null } }
  }
  const download = () => { if (!pdfUrl) return; const link = document.createElement('a'); link.href = pdfUrl; link.download = `Analisis-CasaAndina-${periodo}.pdf`; document.body.appendChild(link); link.click(); link.remove() }
  const displayed = selected?.datos ?? data
  const max = Math.max(1, ...(displayed?.reservasSemana.flatMap(week => [week.confirmadas, week.canceladas]) ?? []))
  const channels = displayed ? [{label:'Directo', value:displayed.canales.reservasDirectas}, {label:'OTA', value:displayed.canales.reservasOTA}, {label:'Otros', value:Math.max(0, displayed.canales.totalReservas - displayed.canales.reservasDirectas - displayed.canales.reservasOTA)}] : []
  return <main className="report-workspace">
    <header className="report-heading"><div><p>ANÁLISIS OPERATIVO</p><h1>Reportes</h1><span>Una mirada detallada a la actividad de tu sede.</span></div>
    <div className="report-actions"><label>Periodo<select value={periodo} disabled={analysis.isPending || detail.isPending} onChange={event => { analysis.reset(); setSelected(null); setPage(1); setPeriodo(event.target.value as Periodo) }}><option value="7d">Últimos 7 días</option><option value="30d">Últimos 30 días</option><option value="mes">Este mes</option></select></label><button type="button" disabled={loading || analysis.isPending} onClick={() => { analysis.reset(); setSelected(null); void refetch() }}>Actualizar datos</button><button type="button" aria-expanded={historyOpen} aria-controls="report-history" onClick={() => setHistoryOpen(current => !current)}>{historyOpen ? 'Ocultar historial' : 'Historial de reportes'}</button><button type="button" className="report-download" disabled={!selected || pdfLoading || !can("reportes.exportar")} onClick={() => void generatePdf()}>Generar PDF</button></div></header>
    {historyOpen && <dialog ref={historyDialog} id="report-history" className="report-panel report-history" aria-labelledby="report-history-title" onCancel={event => { event.preventDefault(); setHistoryOpen(false) }}><header className="report-history-header"><div><p className="report-kicker">HISTORIAL</p><h2 id="report-history-title">Análisis guardados</h2></div><button type="button" className="report-history-close" aria-label="Cerrar historial" onClick={() => setHistoryOpen(false)}>×</button></header><p>Consulta informes anteriores del periodo seleccionado y descarga su PDF.</p>{history.isLoading && <p role="status">Cargando historial…</p>}{history.isError && <p role="alert">No se pudo cargar el historial. Comprueba que la migración de reportes se haya aplicado.</p>}{detail.isError && <p role="alert">No se pudo abrir el análisis seleccionado.</p>}{history.data?.items.length === 0 && <p>Todavía no hay análisis guardados para este periodo.</p>}{history.data && history.data.items.length > 0 && <><ul>{history.data.items.map(item => <li key={item.id}><span>{new Date(item.generadoUtc.endsWith('Z') ? item.generadoUtc : item.generadoUtc + 'Z').toLocaleString('es-PE', { timeZone: 'America/Lima' })}</span><button type="button" disabled={detail.isPending} onClick={() => detail.mutate(item.id)}>{selected?.id === item.id ? 'Seleccionado' : 'Ver análisis'}</button></li>)}</ul><nav aria-label="Páginas del historial"><button disabled={page === 1 || history.isFetching} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page}</span><button disabled={!history.data.haySiguiente || history.isFetching} onClick={() => setPage(page + 1)}>Siguiente</button></nav></>}</dialog>}
    {loading && <p role="status">Cargando indicadores…</p>}{error && <p role="alert">{error} <button type="button" onClick={() => void refetch()}>Reintentar</button></p>}
    {displayed && !error && <div className="report-layout"><div className="report-visuals"><section className="report-panel report-overview"><p className="report-kicker">INFORME DE LA SEDE</p><h2>{displayed.sedeNombre}</h2><p>Datos del periodo seleccionado · ocupación al día del corte</p><div className="report-numbers"><div><span>Reservas</span><strong>{displayed.kpis.totalReservas}</strong><small>Anterior: {displayed.kpis.totalReservasPeriodoAnterior}</small></div><div><span>Importe reservado</span><strong>{formatSoles(displayed.kpis.importeReservadoSoles)}</strong><small>No equivale a cobros</small></div><div><span>Ocupación actual</span><strong>{displayed.kpis.ocupacionActualPct.toFixed(1)}%</strong><small>Habitaciones ocupadas hoy</small></div></div></section>
    <section className="report-panel"><p className="report-kicker">EVOLUCIÓN</p><h2>Reservas por semana</h2><p>Últimas seis semanas · fecha de creación y estado actual</p><div className="report-legend"><span><i className="is-green" /> Reservadas</span><span><i className="is-gold" /> Canceladas</span></div><div className="report-bars">{displayed.reservasSemana.map(week => <div className="report-bar-row" key={week.semanaLabel}><span>{week.semanaLabel}</span><div><div className="report-bar-track"><i className="is-green" style={{width:`${week.confirmadas / max * 100}%`}} /></div><div className="report-bar-track"><i className="is-gold" style={{width:`${week.canceladas / max * 100}%`}} /></div></div><strong>{week.confirmadas} / {week.canceladas}</strong></div>)}</div></section>
    <section className="report-panel"><p className="report-kicker">DISTRIBUCIÓN</p><h2>Canales de reserva</h2><p>Reservas no canceladas creadas en el periodo</p><div className="report-channels">{channels.map(channel => <div key={channel.label}><div><strong>{channel.label}</strong><span>{channel.value} · {displayed.canales.totalReservas ? (channel.value / displayed.canales.totalReservas * 100).toFixed(0) : 0}%</span></div><div className="report-channel-track"><i style={{width:`${displayed.canales.totalReservas ? channel.value / displayed.canales.totalReservas * 100 : 0}%`}} /></div></div>)}</div></section></div>
    <aside className="report-panel report-ai"><p className="report-kicker">ANÁLISIS ASISTIDO</p><h2>Hallazgos y acciones</h2><p>Gemini interpreta los indicadores y sugiere acciones para evaluar.</p><button className="report-analyze" type="button" disabled={analysis.isPending || loading || !!error || !can("reportes.analizar")} onClick={() => analysis.mutate(periodo)}>{analysis.isPending ? 'Analizando…' : selected ? 'Consultar análisis' : 'Analizar con IA'}</button>{analysis.isError && <p role="alert" className="report-error">No se pudo generar el análisis. Inténtalo más tarde.</p>}{selected ? <><p className="report-generated">Generado: {new Date(selected.generadoUtc.endsWith('Z') ? selected.generadoUtc : selected.generadoUtc + 'Z').toLocaleString('es-PE', { timeZone: 'America/Lima' })} · Guardado en el historial</p>{[['Resumen ejecutivo',selected.resumen],['Hallazgos',selected.hallazgos],['Acciones sugeridas',selected.recomendaciones],['Limitaciones',selected.limitaciones]].map(([title,content]) => <section className="report-ai-section" key={title}><h3>{title}</h3><p>{content}</p></section>)}<p className="report-disclaimer">Contenido generado por IA. Revisa las conclusiones antes de tomar decisiones.</p></> : <div className="report-ai-empty"><strong>Tu análisis aparecerá aquí</strong><span>Se genera solo cuando lo solicitas. Incluye hallazgos, acciones sugeridas y sus limitaciones.</span></div>}</aside></div>}

    {pdfOpen && <PdfDialog url={pdfUrl} title="Análisis de la sede" eyebrow="REPORTE CON ANÁLISIS ASISTIDO" footer="Cifras y análisis del mismo corte · Revisa las recomendaciones antes de decidir." loading={pdfLoading} error={pdfError} onClose={closePdf} onRetry={() => void generatePdf()} onDownload={download} />}
  </main>
}
