import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import api from '@/shared/lib/api'

export function BloqueoDialog({ habitacion, close, saved }: { habitacion: { habitacionId: number; numero: string }; close: () => void; saved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [inicio, setInicio] = useState(''); const [fin, setFin] = useState(''); const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close() }, [])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('')
    try { await api.post('/habitaciones/bloqueos', { habitacionId: habitacion.habitacionId, inicio, fin, motivo: motivo.trim() }); saved() }
    catch (e) { setError(axios.isAxiosError(e) ? e.response?.data?.detail || e.response?.data?.title || 'No se pudo guardar el bloqueo.' : 'No se pudo guardar el bloqueo.') }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="cal-dialog" aria-labelledby="bloqueo-title" onCancel={e => { e.preventDefault(); if (!busy) close() }}><form onSubmit={submit}>
    <header><div><small>GESTIÓN DE HABITACIONES</small><h2 id="bloqueo-title">Bloquear habitación {habitacion.numero}</h2></div><button type="button" onClick={close} disabled={busy} aria-label="Cerrar">×</button></header>
    <label>Inicio<input type="date" required min={hoy} value={inicio} onChange={e => setInicio(e.target.value)} /></label>
    <label>Fin del bloqueo<input type="date" required min={inicio || hoy} value={fin} onChange={e => setFin(e.target.value)} /></label>
    <p>La habitación permanecerá bloqueada hasta el final del día indicado.</p>
    <label>Motivo<input required maxLength={200} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej. Mantenimiento" /></label>
    {error && <p role="alert" className="cal-error">{error}</p>}
    <footer><button type="button" onClick={close} disabled={busy}>Volver</button><button type="submit" disabled={busy || !motivo.trim()}>{busy ? 'Guardando…' : 'Guardar bloqueo'}</button></footer>
  </form></dialog>
}
