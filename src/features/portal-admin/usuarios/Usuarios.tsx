import { PersonalDialog } from './PersonalDialog'
import { useAccess } from '@/app/providers/access-context'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { SECTION_PERMISSIONS } from '@/app/providers/access-context'
import './usuarios.css'

interface UsuarioAdmin {
  usuarioId: number
  nombre: string
  correo: string | null
  telefono: string | null
  tipoPersona: string
  sedeId: number | null
  sedeNombre: string | null
  fechaRegistro: string
  roles: string[]
  permisos: string[]
  activo: boolean
}
interface Paginated<T> { items: T[]; pageNumber: number; totalPages: number; totalCount: number }
interface CuentaForm { correo: string; telefono: string }

const dateLabel = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value))
const getMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { title?: string; detail?: string; errors?: Record<string, string[]> } } }).response?.data
    return response?.errors ? Object.values(response.errors).flat()[0] : response?.detail ?? response?.title
  }
  return undefined
}

const EyeIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
const EditIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="m16.5 3.5 4 4L9 19l-5 1 1-5Z"/></svg>
const DisableIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>
const RolesIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>

function DeactivateDialog({ user, busy, error, close, confirm }: { user: UsuarioAdmin; busy: boolean; error: string | null; close: () => void; confirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="users-native-dialog users-confirm-dialog" aria-labelledby="deactivate-title" aria-describedby="deactivate-description" onCancel={event => { event.preventDefault(); if (!busy) close() }}>
    <div className="users-confirm-content"><header><div><p>ADMINISTRACIÓN DE USUARIOS</p><h2 id="deactivate-title">Desactivar cuenta</h2></div><button type="button" onClick={close} disabled={busy} aria-label="Cerrar">×</button></header>
      <p id="deactivate-description">¿Deseas desactivar la cuenta de <strong>{user.nombre}</strong>?</p>
      <div className="users-confirm-note">El usuario dejará de tener acceso al sistema. Su información permanecerá registrada.</div>
      {error && <p className="users-alert" role="alert">{error}</p>}
      <footer><button type="button" onClick={close} disabled={busy}>Cancelar</button><button type="button" className="users-confirm-danger" onClick={confirm} disabled={busy}>{busy ? 'Desactivando…' : 'Desactivar cuenta'}</button></footer>
    </div>
  </dialog>
}

export const Usuarios = () => {
  const { can } = useAccess()
  const [personalDialog, setPersonalDialog] = useState<{ user: UsuarioAdmin | null } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<UsuarioAdmin | null>(null)
  const [deactivating, setDeactivating] = useState<UsuarioAdmin | null>(null)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [form, setForm] = useState<CuentaForm>({ correo: '', telefono: '' })
  const [actionError, setActionError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ['admin', 'usuarios', search, page],
    queryFn: async () => await api.get('/usuarios', { params: { buscar: search || undefined, pageNumber: page, pageSize: 20 } }) as Paginated<UsuarioAdmin>,
  })
  const detailsQuery = useQuery({
    queryKey: ['admin', 'usuario', selectedId],
    queryFn: async () => await api.get(`/usuarios/${selectedId}`) as UsuarioAdmin,
    enabled: selectedId !== null,
  })
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })
  const updateMutation = useMutation({
    mutationFn: async () => await api.put(`/usuarios/${editing?.usuarioId}/cuenta`, { correo: form.correo, telefono: form.telefono || null }),
    onSuccess: async () => { setEditing(null); setActionError(null); await invalidate(); await queryClient.invalidateQueries({ queryKey: ['admin', 'usuario', editing?.usuarioId] }) },
    onError: error => setActionError(getMessage(error) ?? 'No se pudieron guardar los cambios.'),
  })
  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/usuarios/${id}`),
    onSuccess: async () => { setDeactivating(null); setDeactivateError(null); await invalidate() },
    onError: error => setDeactivateError(getMessage(error) ?? 'No se pudo desactivar la cuenta.'),
  })
  const startEdit = (user: UsuarioAdmin) => { setEditing(user); setForm({ correo: user.correo ?? '', telefono: user.telefono ?? '' }); setActionError(null) }
  const visibleSections = Object.entries(SECTION_PERMISSIONS).filter(([, permission]) => detailsQuery.data?.permisos?.includes(permission)).map(([route]) => route.split("/").pop())

  return (
    <main className="users-page">
      <header className="users-heading"><div><p>ADMINISTRACIÓN DE ACCESOS</p><h1>Usuarios</h1><span>Consulta de cuentas, roles y datos de contacto.</span></div><div className="users-heading-actions"><label className="users-search"><span>Buscar</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} maxLength={100} placeholder="Nombre o correo" /></label>{can("usuarios.asignar") && can("usuarios.editar") && can("roles.ver") && <button className="users-create" onClick={() => setPersonalDialog({ user: null })}>＋ Crear personal</button>}</div></header>
      {actionError && <p className="users-alert" role="alert">{actionError}</p>}
      {usersQuery.isLoading && <p className="users-message" role="status">Consultando usuarios…</p>}
      {usersQuery.isError && <div className="users-alert" role="alert"><span>{getMessage(usersQuery.error) ?? 'No se pudieron cargar los usuarios.'}</span><button onClick={() => void usersQuery.refetch()}>Reintentar</button></div>}
      {usersQuery.data && usersQuery.data.items.length === 0 && <p className="users-message">No hay usuarios que coincidan con la búsqueda.</p>}
      {usersQuery.data && usersQuery.data.items.length > 0 && <>
        <div className="users-table-wrap"><table className="users-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Tipo</th><th>Sede</th><th>Roles</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>
          {usersQuery.data.items.map(user => <tr key={user.usuarioId}><td><strong>{user.nombre}</strong><small>Registro {dateLabel(user.fechaRegistro)}</small></td><td>{user.correo ?? 'Sin correo'}</td><td>{user.tipoPersona}</td><td>{user.sedeNombre ?? 'Sin sede asignada'}</td><td>{user.roles.length ? user.roles.join(', ') : 'Sin rol asignado'}</td><td><span className={`users-status ${user.activo ? 'is-active' : 'is-inactive'}`}>{user.activo ? 'Activo' : 'Inactivo'}</span></td><td className="users-actions"><button className="users-icon-btn" onClick={() => setSelectedId(user.usuarioId)} aria-label={`Ver ${user.nombre}`} title="Ver detalle"><EyeIcon /></button>{can("usuarios.asignar") && can("roles.ver") && <button className="users-icon-btn" onClick={() => setPersonalDialog({ user })} aria-label={`Modificar roles de ${user.nombre}`} title="Modificar roles"><RolesIcon /></button>}<button className="users-icon-btn" disabled={!can("usuarios.editar")} onClick={() => startEdit(user)} aria-label={`Editar cuenta de ${user.nombre}`} title="Editar cuenta"><EditIcon /></button><button className="users-icon-btn" disabled={!user.activo || deactivateMutation.isPending || !can("usuarios.desactivar")} onClick={() => { setDeactivateError(null); setDeactivating(user) }} aria-label={`Desactivar ${user.nombre}`} title="Desactivar cuenta"><DisableIcon /></button></td></tr>)}
        </tbody></table></div>
        <footer className="users-pagination"><span>{usersQuery.data.totalCount} cuentas · página {usersQuery.data.pageNumber} de {Math.max(usersQuery.data.totalPages, 1)}</span><div><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><button disabled={page >= usersQuery.data.totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button></div></footer>
      </>}
      {selectedId !== null && <div className="users-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedId(null) }}><section className="users-detail" role="dialog" aria-modal="true" aria-labelledby="user-detail-title"><header><div><p>PERFIL DE CUENTA</p><h2 id="user-detail-title">{detailsQuery.data?.nombre ?? 'Detalle de usuario'}</h2></div><button onClick={() => setSelectedId(null)} aria-label="Cerrar detalle">×</button></header>{detailsQuery.isLoading ? <p className="users-message">Cargando detalle…</p> : detailsQuery.isError ? <p className="users-alert" role="alert">No se pudo cargar el detalle o la cuenta está fuera del alcance permitido.</p> : detailsQuery.data && <><dl><div><dt>Correo</dt><dd>{detailsQuery.data.correo ?? 'No registrado'}</dd></div><div><dt>Teléfono</dt><dd>{detailsQuery.data.telefono ?? 'No registrado'}</dd></div><div><dt>Tipo de persona</dt><dd>{detailsQuery.data.tipoPersona}</dd></div><div><dt>Sede</dt><dd>{detailsQuery.data.sedeNombre ?? 'Sin sede asignada'}</dd></div><div><dt>Fecha de registro</dt><dd>{dateLabel(detailsQuery.data.fechaRegistro)}</dd></div><div><dt>Estado</dt><dd>{detailsQuery.data.activo ? 'Activo' : 'Inactivo'}</dd></div><div><dt>Roles asignados</dt><dd>{detailsQuery.data.roles.join(', ') || 'Sin rol asignado'}</dd></div></dl><section className="users-permissions"><h3>Secciones permitidas</h3>{visibleSections.length ? <ul>{visibleSections.map(section => <li key={section}>{section}</li>)}</ul> : <p>No hay secciones de la interfaz asignadas a los roles recibidos.</p>}<p>Permisos efectivos de los roles activos. Consulta la matriz por acción en Roles y accesos.</p></section></>}</section></div>}
      {deactivating && <DeactivateDialog user={deactivating} busy={deactivateMutation.isPending} error={deactivateError} close={() => setDeactivating(null)} confirm={() => deactivateMutation.mutate(deactivating.usuarioId)} />}
      {personalDialog && <PersonalDialog user={personalDialog.user} close={() => setPersonalDialog(null)} />}
      {editing && <div className="users-overlay" role="presentation"><form className="users-edit" onSubmit={event => { event.preventDefault(); updateMutation.mutate() }}><header><div><p>EDICIÓN DE CUENTA</p><h2>{editing.nombre}</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar edición">×</button></header><label>Correo de acceso<input required type="email" maxLength={150} value={form.correo} onChange={event => setForm(current => ({ ...current, correo: event.target.value }))} /></label><label>Teléfono de notificación<input type="tel" pattern="\+?[0-9]{8,15}" value={form.telefono} onChange={event => setForm(current => ({ ...current, telefono: event.target.value }))} placeholder="Opcional; si lo completas se actualizará" /></label><p>El correo de acceso es independiente del correo de notificación. Los roles y la sede no se editan aquí.</p>{actionError && <span className="users-alert" role="alert">{actionError}</span>}<footer><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" disabled={updateMutation.isPending || !can("usuarios.editar")}>{updateMutation.isPending ? 'Guardando…' : 'Guardar'}</button></footer></form></div>}
    </main>
  )
}
