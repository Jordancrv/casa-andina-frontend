import { useEffect, useRef, useState } from 'react'
import { PdfDialog } from '@/shared/ui/PdfDialog'
import { getComprobantePdf } from './comprobante.api'
import './comprobante.css'

interface Props { reservaId: number; tipo?: string | null; numero?: string | null }
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
    {preview && <PdfDialog url={url} title={`${label} · Vista previa`} eyebrow="COMPROBANTE DE TU RESERVA" footer="Pago simulado. Si tu navegador no muestra el documento, utiliza «Descargar PDF»." loading={loading} error={error} onClose={() => setPreview(false)} onRetry={() => void load()} onDownload={() => void download()} />}
  </div>
}
