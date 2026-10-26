import { lazy, Suspense, useEffect, useRef } from 'react'
import './pdf.css'

const PdfCanvas = lazy(() => import('./PdfCanvas'))

export function PdfDialog({ url, title, eyebrow, footer, loading, error, onClose, onRetry, onDownload }: {
  url: string | null; title: string; eyebrow: string; footer: string; loading: boolean; error: string | null
  onClose: () => void; onRetry: () => void; onDownload: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialogRef.current
    if (element && !element.open) element.showModal()
    return () => { if (element?.open) element.close() }
  }, [])
  return <dialog ref={dialogRef} className="receipt-preview" aria-labelledby="pdf-preview-title" onClose={event => { if (!event.currentTarget.open) onClose() }}>
    <header><div><p>{eyebrow}</p><h2 id="pdf-preview-title">{title}</h2></div><div className="receipt-preview-tools"><button className="pdf-download" disabled={!url || loading} type="button" onClick={onDownload}>Descargar PDF ↓</button><button className="receipt-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Cerrar vista previa">×</button></div></header>
    <div className="receipt-preview-body">
      {loading && <p className="receipt-state" role="status">Generando documento…</p>}
      {!loading && error && <div className="receipt-state receipt-error" role="alert"><p>{error}</p><button className="pdf-retry" type="button" onClick={onRetry}>Reintentar</button></div>}
      {!loading && !error && url && <Suspense fallback={<p className="receipt-state" role="status">Cargando visor PDF…</p>}><PdfCanvas key={url} url={url} /></Suspense>}
    </div>
    <footer>{footer}</footer>
  </dialog>
}
