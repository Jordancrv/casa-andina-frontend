import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export default function PdfCanvas({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [width, setWidth] = useState(0)
  const [rendered, setRendered] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState(1)
  const renderKey = `${pageNumber}:${width}:${attempt}:${zoom}`

  useEffect(() => {
    let disposed = false
    const task = getDocument({ url, enableXfa: false, useSystemFonts: false })
    task.promise.then(document => { if (!disposed) setPdf(document) })
      .catch(() => { if (!disposed) setError('No se pudo abrir el documento en el visor. Puedes descargar el PDF.') })
    return () => { disposed = true; void task.destroy().catch(() => {}) }
  }, [url])
  useEffect(() => {
    if (!host.current) return
    const observer = new ResizeObserver(entries => setWidth(Math.floor(entries[0].contentRect.width)))
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!pdf || !canvas || width === 0) return
    let disposed = false
    let task: RenderTask | null = null
    pdf.getPage(pageNumber).then(async page => {
      if (disposed) return
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: (Math.min(840, Math.max(240, width - 32)) / base.width) * zoom })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.ceil(viewport.width * ratio)
      canvas.height = Math.ceil(viewport.height * ratio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      task = page.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] })
      await task.promise
      if (!disposed) { setRendered(renderKey); setError(null) }
    }).catch(() => { if (!disposed) setError('No se pudo mostrar esta página. Inténtalo de nuevo o descarga el PDF.') })
    return () => { disposed = true; task?.cancel() }
  }, [pdf, pageNumber, width, zoom, renderKey])

  return <div className="receipt-canvas-viewer">
    <div className="receipt-page-controls"><div className="receipt-pager"><button type="button" disabled={!pdf || pageNumber <= 1} onClick={() => setPageNumber(current => current - 1)}>← Anterior</button><span aria-live="polite">{pdf ? `Página ${pageNumber} de ${pdf.numPages}` : 'Abriendo PDF…'}</span><button type="button" disabled={!pdf || pageNumber >= pdf.numPages} onClick={() => setPageNumber(current => current + 1)}>Siguiente →</button></div><div className="receipt-zoom"><button type="button" aria-label="Reducir tamaño del PDF" disabled={zoom <= .5} onClick={() => setZoom(current => current - .25)}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Aumentar tamaño del PDF" disabled={zoom >= 2.5} onClick={() => setZoom(current => current + .25)}>＋</button></div></div>
    <div className="receipt-canvas-scroll" ref={host}>
      {!error && rendered !== renderKey && <p className="receipt-canvas-loading" role="status">Cargando página…</p>}
      {error && <div className="receipt-state receipt-error" role="alert"><p>{error}</p>{pdf && <button className="pdf-retry" type="button" onClick={() => { setError(null); setAttempt(current => current + 1) }}>Reintentar página</button>}</div>}
      <canvas key={`${pageNumber}:${width}:${zoom}`} ref={canvasRef} aria-label={`Página ${pageNumber} del documento`} role="img" style={{ visibility: rendered === renderKey && !error ? 'visible' : 'hidden' }} />
    </div>
  </div>
}
