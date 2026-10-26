import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { getComprobantePdf } from './comprobante.api'
import './comprobante.css'

interface Props { reservaId: number; tipo?: string | null; numero?: string | null }
const PdfCanvas = lazy(() => import('./PdfCanvas'))

function PdfPreview({ url, tipo, loading, error, onClose, onRetry, onDownload }: {
  url: string | null; tipo: string; loading: boolean; error: string | null
  onClose: () => void; onRetry: () => void; onDownload: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialogRef.current
    if (element && !element.open) element.showModal()
    return () => { if (element?.open) element.close() }
  }, [])
  return <dialog ref={dialogRef} className="receipt-preview" aria-labelledby="receipt-preview-title" onClose={event => { if (!event.currentTarget.open) onClose() }}>
    <header><div><p>COMPROBANTE DE TU RESERVA</p><h2 id="receipt-preview-title">{tipo} · Vista previa</h2></div><div className="receipt-preview-tools"><button className="client-primary" disabled={!url || loading} type="button" onClick={onDownload}>Descargar PDF ↓</button><button className="receipt-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Cerrar vista previa">×</button></div></header>
    <div className="receipt-preview-body">
      {loading && <p className="receipt-state" role="status">Preparando tu comprobante…</p>}
      {!loading && error && <div className="receipt-state receipt-error" role="alert"><p>{error}</p><button className="client-secondary" type="button" onClick={onRetry}>Reintentar</button></div>}
      {!loading && !error && url && <Suspense fallback={<p className="receipt-state" role="status">Cargando visor PDF…</p>}><PdfCanvas url={url} /></Suspense>}
    </div>
    <footer>Pago simulado. Si tu navegador no muestra el documento, utiliza «Descargar PDF».</footer>
  </dialog>
}

export function ComprobanteActions({ reservaId, tipo, numero }: Props) {
  const [preview, setPreview] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resource = useRef<{ url: string | null; controller: AbortController | null }>({ url: null, controller: null })
  useEffect(() => {
    const current = resource.current
    return () => { current.controller?.abort(); if (current.url) URL.revokeObjectURL(current.url) }
  }, [])
  const label = tipo === 'Factura' ? 'Factura' : tipo === 'Boleta' ? 'Boleta' : 'Comprobante'
  const filename = `${label}-${(numero || `reserva-${reservaId}`).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
  const load = async () => {
    if (resource.current.url) return resource.current.url
    if (resource.current.controller) return null
    const controller = new AbortController()
    resource.current.controller = controller
    setLoading(true); setError(null)
    try {
      const pdf = await getComprobantePdf(reservaId, controller.signal)
      if (controller.signal.aborted) return null
      const objectUrl = URL.createObjectURL(pdf)
      resource.current.url = objectUrl
      setUrl(objectUrl)
      return objectUrl
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo preparar el comprobante. Vuelve a intentarlo.')
      return null
    } finally {
      if (!controller.signal.aborted) setLoading(false)
      resource.current.controller = null
    }
  }
  const download = async () => {
    const objectUrl = await load()
    if (!objectUrl) return
    const link = document.createElement('a')
    link.href = objectUrl; link.download = filename
    document.body.appendChild(link); link.click(); link.remove()
  }
  return <div className="receipt-access">
    <div className="receipt-actions"><button className="client-secondary" type="button" disabled={loading} onClick={() => { setPreview(true); void load() }}>Previsualizar {label.toLowerCase()} ↗</button><button className="client-secondary" type="button" disabled={loading} onClick={() => void download()}>{loading && !preview ? 'Preparando PDF…' : 'Descargar PDF ↓'}</button></div>
    {!preview && error && <p className="receipt-error" role="alert">{error}</p>}
    {preview && <PdfPreview url={url} tipo={label} loading={loading} error={error} onClose={() => setPreview(false)} onRetry={() => void load()} onDownload={() => void download()} />}
  </div>
}
