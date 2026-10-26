import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { actualizarCliente, crearCliente, crmError } from './clientes.api'
import type { CatalogosCrm, Cliente, ClienteDatos } from './clientes.types'

interface Props { cliente: Cliente | null; catalogos: CatalogosCrm; sedeInicial: string; onClose: () => void; onSaved: (nuevo: boolean, sedeId: number | null) => Promise<void> }

export function ClienteForm({ cliente, catalogos, sedeInicial, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [datos, setDatos] = useState<ClienteDatos>(() => ({
    tipoPersona: cliente?.tipoPersona === 'Jurídica' ? 'J' : 'N',
    nombre: cliente ? cliente.nombres ?? cliente.razonSocial ?? cliente.nombre : '',
    apellidos: cliente?.apellidos ?? '', nombreComercial: cliente?.nombreComercial ?? '',
    tipoDocumentoId: cliente?.tipoDocumentoId ?? 0, numeroDocumento: cliente?.documentoNumero ?? '',
    correoNotificacion: cliente?.correoNotificacion ?? '', telefono: cliente?.telefono ?? '',
    estado: cliente?.estado ?? 'Activo',
    sedeRegistroId: cliente ? cliente.sedeRegistroId : catalogos.sedeAsignadaId ?? (Number(sedeInicial) || null),
  }))
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: async () => {
      const normalizados: ClienteDatos = { ...datos, nombre: datos.nombre.trim(),
        apellidos: datos.tipoPersona === 'N' ? datos.apellidos?.trim() || null : null,
        nombreComercial: datos.tipoPersona === 'J' ? datos.nombreComercial?.trim() || null : null,
        correoNotificacion: datos.correoNotificacion?.trim() || null, telefono: datos.telefono?.trim() || null,
        numeroDocumento: datos.numeroDocumento.trim().toUpperCase() }
      if (cliente) await actualizarCliente(cliente.clienteId, normalizados)
      else await crearCliente(normalizados)
    },
    onSuccess: async () => { await onSaved(!cliente, datos.sedeRegistroId); onClose() },
    onError: err => setError(crmError(err)),
  })
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const tipos = catalogos.tiposDocumento.filter(t => t.tipoPersonaPermitida === 'A' || t.tipoPersonaPermitida === datos.tipoPersona)
  const tipo = tipos.find(t => t.id === datos.tipoDocumentoId)
  const set = <K extends keyof ClienteDatos>(key: K, value: ClienteDatos[K]) => { setDatos(prev => ({ ...prev, [key]: value })); setError(null) }
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!mutation.isPending) { setError(null); mutation.mutate() } }

  return <dialog className="clients-dialog clients-edit-dialog" ref={dialog} onClose={onClose} onCancel={event => { if (mutation.isPending) event.preventDefault() }} aria-labelledby="client-form-title">
    <form className="clients-edit" onSubmit={submit}>
      <header><div><p>RELACIÓN CON CLIENTES</p><h2 id="client-form-title">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2><span>{cliente ? cliente.nombre : 'Registra un perfil para empezar a conocerlo.'}</span></div><button type="button" onClick={onClose} disabled={mutation.isPending} aria-label="Cerrar formulario">×</button></header>
      <fieldset disabled={mutation.isPending}>
        <legend className="clients-sr-only">Datos del perfil</legend>
        <label>Tipo de persona<select value={datos.tipoPersona} disabled={!!cliente} onChange={event => { setDatos(prev => ({ ...prev, tipoPersona: event.target.value as 'N' | 'J', tipoDocumentoId: 0 })); setError(null) }}><option value="N">Persona natural</option><option value="J">Persona jurídica</option></select></label>
        <label>{datos.tipoPersona === 'N' ? 'Nombres' : 'Razón social'}<input autoFocus required maxLength={200} value={datos.nombre} onChange={event => set('nombre', event.target.value)} autoComplete="off" /></label>
        {datos.tipoPersona === 'N' ? <label>Apellidos<input maxLength={100} value={datos.apellidos ?? ''} onChange={event => set('apellidos', event.target.value)} autoComplete="off" /></label> : <label>Nombre comercial <small>Opcional</small><input maxLength={150} value={datos.nombreComercial ?? ''} onChange={event => set('nombreComercial', event.target.value)} /></label>}
        <div className="clients-form-pair"><label>Documento<select required value={datos.tipoDocumentoId || ''} onChange={event => set('tipoDocumentoId', Number(event.target.value))}><option value="">Selecciona</option>{tipos.map(t => <option key={t.id} value={t.id}>{t.codigo}</option>)}</select></label><label>Número<input required minLength={tipo?.longitudMinima} maxLength={tipo?.longitudMaxima ?? 20} pattern={tipo?.codigo === 'DNI' ? '[0-9]{8}' : tipo?.codigo === 'RUC' ? '[0-9]{11}' : '[A-Za-z0-9]+'} inputMode={tipo?.codigo === 'DNI' || tipo?.codigo === 'RUC' ? 'numeric' : 'text'} value={datos.numeroDocumento} onChange={event => set('numeroDocumento', event.target.value.replace(/\s/g, '').toUpperCase())} /></label></div>
        <label>Correo de notificación <small>Opcional</small><input type="email" maxLength={150} value={datos.correoNotificacion ?? ''} onChange={event => set('correoNotificacion', event.target.value)} placeholder="cliente@ejemplo.com" /></label>
        <label>Teléfono <small>Opcional</small><input type="tel" maxLength={16} pattern="\+?[0-9]{7,15}" value={datos.telefono ?? ''} onChange={event => set('telefono', event.target.value)} placeholder="+51987654321" /></label>
        {!cliente && <label>Sede de registro<select required disabled={!catalogos.puedeElegirSede} value={datos.sedeRegistroId ?? ''} onChange={event => set('sedeRegistroId', Number(event.target.value) || null)}><option value="">Selecciona una sede</option>{catalogos.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>}
        <label>Estado comercial<select value={datos.estado} onChange={event => set('estado', event.target.value as 'Activo' | 'Inactivo')}><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></label>
      </fieldset>
      <div className="clients-form-note"><strong>Categoría automática</strong><p>Ocasional: 0–1 estadías completadas · Frecuente: 2–4 · VIP: 5 o más.</p><p>{cliente ? 'El correo de notificación es independiente del correo de acceso. Los datos de identidad y contacto pertenecen al perfil compartido del cliente.' : 'El alta crea un perfil comercial. La cuenta de acceso se administra por separado.'}</p></div>
      {error && <p className="clients-form-error" role="alert">{error}</p>}
      <footer><button type="button" disabled={mutation.isPending} onClick={onClose}>Cancelar</button><button className="clients-primary" type="submit" disabled={mutation.isPending || !tipo || (!cliente && !datos.sedeRegistroId)}>{mutation.isPending ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Crear cliente'}</button></footer>
    </form>
  </dialog>
}
