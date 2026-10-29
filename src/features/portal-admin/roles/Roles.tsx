import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { useAccess } from '@/app/providers/access-context'
import './roles.css'

interface Role { id: number; nombre: string; descripcion: string | null; sedeId: number | null; protegido: boolean; activo: boolean; version: string; permisos: string[]; usuarios: number; propio: boolean }
interface Catalog { roles: Role[]; permisos: { codigo: string; seccion: string; delegable: boolean }[]; sedeId: number | null }
interface Staff { id: number; correo: string; activo: boolean; protegido: boolean; roles: number[] }
interface RoleForm { id?: number; nombre: string; descripcion: string; permisos: string[]; version?: string }
const labels: Record<string, string> = { ver: 'Consultar', crear: 'Crear', editar: 'Editar', desactivar: 'Desactivar', asignar: 'Asignar roles', gestionar: 'Administrar roles', ingreso: 'Registrar ingreso', salida: 'Registrar salida', analizar: 'Generar análisis', exportar: 'Exportar PDF' }
const sections: Record<string, string> = { dashboard: 'Dashboard', calendario: 'Calendario', recepcion: 'Recepción', clientes: 'Clientes', usuarios: 'Usuarios', habitaciones: 'Habitaciones', servicios: 'Servicios', comodidades: 'Comodidades', reportes: 'Reportes', roles: 'Roles y accesos', sedes: 'Sedes' }
function errorText(error: unknown) {
 const data = (error as { response?: { data?: { detail?: string; title?: string } } })?.response?.data
 return data?.detail ?? data?.title ?? 'No se pudo completar la operación. Inténtalo nuevamente.'
}

export function Roles() {
 const access = useAccess()
 const client = useQueryClient()
 const [tab, setTab] = useState<'roles' | 'personal'>('roles')
 const [search, setSearch] = useState('')
 const [page, setPage] = useState(1)
 const [form, setForm] = useState<RoleForm | null>(null)
 const [readOnly, setReadOnly] = useState(false)
 const [staff, setStaff] = useState<Staff | null>(null)
 const [selection, setSelection] = useState<number[]>([])
 const [notice, setNotice] = useState('')
 const dialog = useRef<HTMLDialogElement>(null)
 const catalog = useQuery({ queryKey: ['roles', access.data?.usuarioId], queryFn: async () => await api.get('/accesos/roles') as Catalog })
 const people = useQuery({ queryKey: ['personal-roles', page, search, access.data?.usuarioId], enabled: tab === 'personal' && access.can('usuarios.asignar'),
  queryFn: async () => await api.get('/accesos/personal', { params: { pagina: page, buscar: search } }) as { items: Staff[]; total: number } })
 const refresh = async () => { await client.invalidateQueries({ queryKey: ['roles'] }); await client.invalidateQueries({ queryKey: ['personal-roles'] }); await client.invalidateQueries({ queryKey: ['admin', 'usuarios'] }); access.refresh() }
 const close = () => { setForm(null); setStaff(null); setNotice(''); dialog.current?.close() }
 const save = useMutation({ mutationFn: async () => {
  if (staff) await api.put(`/accesos/personal/${staff.id}/roles`, { roles: selection, rolesAnteriores: staff.roles })
  else if (form?.id) await api.put(`/accesos/roles/${form.id}`, form)
  else await api.post('/accesos/roles', form)
 }, onSuccess: async () => { close(); await refresh() } })
 const deactivate = useMutation({ mutationFn: async (role: Role) => await api.delete(`/accesos/roles/${role.id}`, { params: { version: role.version } }), onSuccess: refresh })
 useEffect(() => { if (form || staff) dialog.current?.showModal() }, [form, staff])
 const openRole = (role?: Role, copy = false) => {
  save.reset(); setNotice(''); setReadOnly(!!role && !copy && (role.protegido || role.propio || !role.activo || !access.can('roles.gestionar')))
  const allowed = catalog.data?.permisos.filter(p => p.delegable).map(p => p.codigo) ?? []
  setForm(role ? { id: copy ? undefined : role.id, nombre: copy ? `${role.nombre} local`.slice(0, 50) : role.nombre,
   descripcion: role.descripcion ?? '', permisos: copy ? role.permisos.filter(p => allowed.includes(p)) : role.permisos, version: copy ? undefined : role.version }
   : { nombre: '', descripcion: '', permisos: [] })
 }
 const toggle = (code: string) => setForm(current => {
  if (!current) return current
  const section = code.split('.')[0], view = `${section}.ver`
  const next = current.permisos.includes(code) ? current.permisos.filter(p => p !== code && !(code === view && p.startsWith(`${section}.`))) : [...new Set([...current.permisos, view, code])]
  return { ...current, permisos: next }
 })
 const assignable = catalog.data?.roles.filter(r => r.activo && r.permisos.length > 0 && r.permisos.every(p => catalog.data?.permisos.some(item => item.codigo === p && item.delegable))) ?? []
 return <main className="roles-page">
  <header className="roles-heading"><div><p>ADMINISTRACIÓN DEL PERSONAL</p><h1>Roles y accesos</h1><span>Define las funciones y permisos del personal de tu sede.</span></div>
   {access.can('roles.gestionar') && catalog.data?.sedeId && <button className="roles-primary" onClick={() => openRole()}>Crear rol</button>}</header>
  <nav className="roles-tabs" aria-label="Administración de accesos"><button aria-pressed={tab === 'roles'} onClick={() => setTab('roles')}>Roles de la sede</button>
   {access.can('usuarios.asignar') && catalog.data?.sedeId && <button aria-pressed={tab === 'personal'} onClick={() => setTab('personal')}>Asignar al personal</button>}</nav>
  {catalog.isLoading && <p>Cargando roles…</p>}
  {catalog.isError && <p role="alert">{errorText(catalog.error)} <button onClick={() => void catalog.refetch()}>Reintentar</button></p>}
  {deactivate.isError && <p role="alert">{errorText(deactivate.error)}</p>}
  {tab === 'roles' && catalog.data && <><p className="roles-note">Los roles protegidos sirven como plantillas. Crea una copia para ajustar sus permisos en tu sede.</p>
   <div className="roles-table"><table><thead><tr><th>Rol</th><th>Ámbito</th><th>Permisos</th><th>Personal de la sede</th><th>Acciones</th></tr></thead><tbody>
    {catalog.data.roles.map(role => <tr key={role.id}><td><strong>{role.nombre}</strong><small>{role.descripcion}</small>{!role.activo && <small>Desactivado</small>}</td><td>{role.protegido ? 'Protegido' : 'Esta sede'}</td><td>{role.permisos.length}</td><td>{role.usuarios}</td><td className="roles-actions">
     <button onClick={() => openRole(role)}>{role.protegido || role.propio || !role.activo || !access.can('roles.gestionar') ? 'Ver permisos' : 'Editar'}</button>
     {access.can('roles.gestionar') && catalog.data.sedeId && <button onClick={() => openRole(role, true)}>Copiar</button>}
     {!role.protegido && role.activo && access.can('roles.gestionar') && <button disabled={role.usuarios > 0 || deactivate.isPending} title={role.usuarios ? 'Reasigna primero al personal' : undefined} onClick={() => { if (window.confirm(`¿Desactivar el rol ${role.nombre}?`)) deactivate.mutate(role) }}>Desactivar</button>}
    </td></tr>)}
   </tbody></table></div></>}
  {tab === 'personal' && <><label className="roles-search">Buscar por correo<input value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1) }} /></label>
   <p className="roles-note">Los permisos de varios roles se suman. Las cuentas administrativas y tu propia cuenta están protegidas.</p>
   {people.isLoading && <p>Cargando personal…</p>}{people.isError && <p role="alert">{errorText(people.error)}</p>}
   <div className="roles-table"><table><thead><tr><th>Personal</th><th>Roles asignados</th><th>Acciones</th></tr></thead><tbody>{people.data?.items.map(person => <tr key={person.id}><td>{person.correo}{!person.activo && <small>Inactivo</small>}</td><td>{person.roles.map(id => catalog.data?.roles.find(r => r.id === id)?.nombre ?? 'Rol no disponible').join(', ') || 'Sin roles'}</td><td><button disabled={person.protegido || !person.activo} onClick={() => { save.reset(); setSelection(person.roles); setStaff(person) }}>Asignar roles</button></td></tr>)}</tbody></table></div>
   {people.data?.total === 0 && <p>No se encontró personal en esta sede.</p>}<footer className="roles-pagination"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page}</span><button disabled={!people.data || page * 20 >= people.data.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></footer></>}
  <dialog ref={dialog} className="roles-dialog" aria-labelledby="roles-dialog-title" onCancel={e => { if (save.isPending) e.preventDefault(); else close() }}>
   <form onSubmit={e => { e.preventDefault(); if (!readOnly || staff) { setNotice(''); save.mutate() } }}>
    <header><div><h2 id="roles-dialog-title">{staff ? 'Asignar roles' : readOnly ? 'Permisos del rol' : form?.id ? 'Editar rol' : 'Crear rol'}</h2><p>{staff?.correo ?? 'Selecciona las secciones y acciones permitidas.'}</p></div><button type="button" disabled={save.isPending} onClick={close} aria-label="Cerrar">×</button></header>
    {form && <><label>Nombre<input required minLength={2} maxLength={50} disabled={readOnly || save.isPending} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></label><label>Descripción<textarea maxLength={200} disabled={readOnly || save.isPending} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></label>
     {form.id && <p className="roles-note">Este cambio afectará a {catalog.data?.roles.find(r => r.id === form.id)?.usuarios ?? 0} personas de la sede en su siguiente solicitud.</p>}
     <div className="roles-matrix">{Object.entries(sections).map(([key, title]) => <fieldset key={key}><legend>{title}</legend>{catalog.data?.permisos.filter(p => p.seccion === key).map(p => <label key={p.codigo} title={!p.delegable ? 'Permiso protegido o fuera del alcance delegable' : undefined}><input type="checkbox" checked={form.permisos.includes(p.codigo)} disabled={readOnly || !p.delegable || save.isPending} onChange={() => toggle(p.codigo)} />{labels[p.codigo.split('.')[1]] ?? p.codigo}{!p.delegable && <small>Protegido</small>}</label>)}</fieldset>)}</div></>}
    {staff && <div className="roles-assignment">{assignable.map(role => <label key={role.id}><input type="checkbox" checked={selection.includes(role.id)} disabled={save.isPending} onChange={() => setSelection(current => current.includes(role.id) ? current.filter(id => id !== role.id) : [...current, role.id])} /><span><strong>{role.nombre}</strong><small>{role.permisos.map(p => `${sections[p.split('.')[0]]}: ${labels[p.split('.')[1]]}`).join(' · ')}</small></span></label>)}{assignable.length === 0 && <p>Crea primero un rol con permisos delegables.</p>}</div>}
    {(save.isError || notice) && <p role="alert">{notice || errorText(save.error)}</p>}
    <footer><button type="button" disabled={save.isPending} onClick={close}>Cerrar</button>{(!readOnly || staff) && <button className="roles-primary" disabled={save.isPending || !!staff && selection.length === 0}>{save.isPending ? 'Guardando…' : 'Guardar cambios'}</button>}</footer>
   </form>
  </dialog>
 </main>
}
