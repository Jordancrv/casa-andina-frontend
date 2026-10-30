import { useEffect, useRef, useState } from 'react'
import { roomImage } from '@/shared/lib/room-image'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { HabitacionDisponible } from './compra.types'

export function GaleriaHabitacion({ habitacion, onClose }: { habitacion: HabitacionDisponible; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const album = useQuery({ queryKey: ['habitacion-imagenes', habitacion.habitacionId], queryFn: async () => await api.get(`/reservas/habitaciones/${habitacion.habitacionId}/imagenes`) as string[], staleTime: 5 * 60 * 1000, retry: 1 })
  const imagenes = album.data ?? []
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  const anterior = () => { if (imagenes.length) setIndex(actual => (actual + imagenes.length - 1) % imagenes.length) }
  const siguiente = () => { if (imagenes.length) setIndex(actual => (actual + 1) % imagenes.length) }
  return <dialog ref={dialogRef} className="room-gallery" aria-labelledby="room-gallery-title" onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); anterior() }
    if (event.key === 'ArrowRight') { event.preventDefault(); siguiente() }
  }}>
    <header><div><small>GALERÍA DE LA HABITACIÓN</small><h2 id="room-gallery-title">{habitacion.tipoHabitacion} · {habitacion.numero}</h2><p>{habitacion.sedeNombre}</p></div><button type="button" onClick={onClose} aria-label="Cerrar galería">×</button></header>
    {album.isPending ? <p className="room-gallery-state" role="status">Cargando fotografías…</p> : album.isError ? <div className="room-gallery-state" role="alert">No se pudieron cargar las fotografías. <button type="button" onClick={() => void album.refetch()}>Reintentar</button></div> : !imagenes.length ? <p className="room-gallery-state">Esta habitación todavía no tiene fotografías en el álbum.</p> : <><div className="room-gallery-view"><img src={roomImage(imagenes[index], 1600)} decoding="async" alt={`${habitacion.tipoHabitacion}, foto ${index + 1} de ${imagenes.length}`} onError={event => { event.currentTarget.style.visibility = 'hidden' }} onLoad={event => { event.currentTarget.style.visibility = 'visible' }} />
      {imagenes.length > 1 && <><button type="button" className="room-gallery-prev" onClick={anterior} aria-label="Foto anterior">‹</button><button type="button" className="room-gallery-next" onClick={siguiente} aria-label="Foto siguiente">›</button></>}
      <span className="room-gallery-count" aria-live="polite">{index + 1} / {imagenes.length}</span>
    </div>
    <div className="room-gallery-thumbnails" aria-label="Elegir fotografía">{imagenes.map((url, i) => <button type="button" key={`${i}-${url}`} onClick={() => setIndex(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === index}><img src={roomImage(url, 180)} alt="" loading="lazy" decoding="async" /></button>)}</div></>}
  </dialog>
}
