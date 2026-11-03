import { useEffect, useState } from 'react'

interface Preview { image: string; author: string; license: string; fileUrl: string }
const previews = new Map<string, Promise<Preview | null>>()
const api = 'https://es.wikipedia.org/w/api.php'

function plainText(value?: string) {
  if (!value) return ''
  return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() ?? ''
}

function getPreview(title: string): Promise<Preview | null> {
  const cached = previews.get(title)
  if (cached) return cached
  const load = async (): Promise<Preview | null> => {
    const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', redirects: '1', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '480', titles: title })
    const response = await fetch(`${api}?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return null
    const data = await response.json()
    const page = Object.values(data.query?.pages ?? {})[0] as { thumbnail?: { source?: string }; pageimage?: string } | undefined
    if (!page?.thumbnail?.source || !page.pageimage) return null
    const imageUrl = new URL(page.thumbnail.source)
    if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'upload.wikimedia.org') return null
    const info = new URLSearchParams({ action: 'query', format: 'json', origin: '*', prop: 'imageinfo', iiprop: 'url|extmetadata', titles: `File:${page.pageimage}` })
    const metadataResponse = await fetch(`${api}?${info}`, { signal: AbortSignal.timeout(8000) })
    if (!metadataResponse.ok) return null
    const metadata = await metadataResponse.json()
    const file = Object.values(metadata.query?.pages ?? {})[0] as { imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] } | undefined
    const image = file?.imageinfo?.[0]
    const author = plainText(image?.extmetadata?.Artist?.value)
    const license = plainText(image?.extmetadata?.LicenseShortName?.value)
    if (!author || !license || !image?.descriptionurl?.startsWith('https://')) return null
    return { image: imageUrl.href, author, license, fileUrl: image.descriptionurl }
  }
  const result = load().catch(() => null)
  previews.set(title, result)
  return result
}

function PlaceCard({ lugar, ciudad }: { lugar: string; ciudad: string }) {
  const [preview, setPreview] = useState<Preview | null>(null)
  useEffect(() => {
    let active = true
    void getPreview(lugar).then(value => { if (active) setPreview(value) })
    return () => { active = false }
  }, [lugar])
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lugar}, ${ciudad}, Perú`)}`
  return <li className="ca-attraction-card">
    <a className="ca-attraction-image" href={map} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${lugar} en Google Maps`}>
      {preview ? <img src={preview.image} alt={lugar} loading="lazy" decoding="async" /> : <span>Vista previa no disponible</span>}
    </a>
    <div className="ca-attraction-body"><strong>{lugar}</strong><a href={map} target="_blank" rel="noopener noreferrer">Ver en el mapa ↗</a>
      {preview && <small>Foto: {preview.author} · <a href={preview.fileUrl} target="_blank" rel="noopener noreferrer">{preview.license} / Wikimedia ↗</a></small>}
    </div>
  </li>
}

export function AttractionsPreview({ ciudad, lugares, fuenteUrl }: { ciudad: string; lugares: string[]; fuenteUrl: string }) {
  return <section className="ca-attractions" aria-label={`Lugares para visitar en ${ciudad}`}>
    <h3>Descubre {ciudad}</h3><p>Ideas para organizar tu visita</p>
    <ul className="ca-attraction-grid">{lugares.map(lugar => <PlaceCard key={lugar} lugar={lugar} ciudad={ciudad} />)}</ul>
    <a href={fuenteUrl} target="_blank" rel="noopener noreferrer">Consultar fuente: PROMPERÚ ↗</a>
  </section>
}
