import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'

interface Role { id: number; nombre: string; activo: boolean; permisos: string[] }
interface Catalog { roles: Role[]; permisos: { codigo: string; delegable: boolean }[] }
interface Assigned { roles: number[]; protegido: boolean; activo: boolean }
interface Props { user: { usuarioId: number; nombre: string } | null; close: () => void }

export function PersonalDialog({ user, close }: Props) {
 const ref = useRef<HTMLDialogElement>(null)
 const client = useQueryClient()
 const [selected, setSelected] = useState<number[] | null>(null)
 const [form, setForm] = useState({ nombreCompleto: '', tipoDocumento: 'DNI', numeroDocumento: '', email: '', telefono: '', password: '' })
 const catalog = useQuery({ queryKey: ['roles-personal-catalog'], queryFn: async () => await api.get('/accesos/roles') as Catalog })
 const assigned = useQuery({ queryKey: ['roles-personal', user?.usuarioId], queryFn: async () => await api.get(`/accesos/personal/${user?.usuarioId}/roles`) as Assigned, enabled: !!user })
 const mutation = useMutation({ mutationFn: async () => {
  if (user) await api.put(`/accesos/personal/${user.usuarioId}/roles`, { roles: selected ?? assigned.data?.roles, rolesAnteriores: assigned.data?.roles })
  else await api.post('/accesos/personal', { ...form, telefono: form.telefono || null, roles: selected ?? [] })
 }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'usuarios'] }); await client.invalidateQueries({ queryKey: ['roles'] }); await client.invalidateQueries({ queryKey: ['personal-roles'] }); close() } })
 useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close() }, [])
 const roles = catalog.data?.roles.filter(r => r.activo && r.permisos.length > 0 && r.permisos.every(p => catalog.data?.permisos.some(x => x.codigo === p && x.delegable))) ?? []
 const values = selected ?? assigned.data?.roles ?? []
 const message = (mutation.error as { response?: { data?: { title?: string; errors?: Record<string, string[]> } } })?.response?.data
 return <dialog ref={ref} className="users-native-dialog" aria-labelledby="personal-title" onCancel={e => { e.preventDefault(); if (!mutation.isPending) close() }}>
  <form className="users-edit users-personal-form" onSubmit={e => { e.preventDefault(); mutation.mutate() }}>
   <header><div><p>PERSONAL DE LA SEDE</p><h2 id="personal-title">{user ? `Accesos de ${user.nombre}` : 'Crear personal'}</h2></div><button type="button" onClick={close} disabled={mutation.isPending} aria-label="Cerrar">×</button></header>
   {!user && <><div className="users-personal-intro"><h3>Datos de la cuenta</h3><p>Registra los datos del integrante de tu sede.</p></div><div className="users-personal-grid"><label className="users-field-wide">Nombre completo<input required minLength={3} maxLength={200} autoComplete="name" value={form.nombreCompleto} onChange={e => setForm({ ...form, nombreCompleto: e.target.value })} /></label>
    <label>Tipo de documento<select value={form.tipoDocumento} onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}><option>DNI</option><option>CE</option><option>PASAPORTE</option></select></label>
    <label>Número de documento<input required maxLength={20} value={form.numeroDocumento} onChange={e => setForm({ ...form, numeroDocumento: e.target.value })} /></label>
    <label>Correo de acceso<input required type="email" maxLength={150} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
    <label>Teléfono (opcional)<input type="tel" pattern="\+?[0-9]{7,15}" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></label>
    <label className="users-field-wide">Contraseña inicial<input required type="password" minLength={10} maxLength={72} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><p className="users-field-wide users-password-note">Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo.</p></div></>}
   <fieldset className="users-role-options"><legend>Roles asignados</legend><p>Selecciona uno o varios roles para esta cuenta.</p><div className="users-role-list">
    {catalog.isLoading || (user && assigned.isLoading) ? <p>Cargando roles…</p> : catalog.isError || assigned.isError ? <p role="alert">No se pudieron cargar los roles o la cuenta no pertenece a tu sede.</p> : assigned.data?.protegido ? <p>Esta cuenta está protegida y sus roles no se pueden modificar aquí.</p> : roles.map(role => <label key={role.id}><input type="checkbox" checked={values.includes(role.id)} onChange={() => setSelected(values.includes(role.id) ? values.filter(id => id !== role.id) : [...values, role.id])} /><span>{role.nombre}</span></label>)}
    {!catalog.isLoading && !roles.length && <p>No hay roles delegables disponibles. Crea uno en Roles y accesos.</p>}
   </div></fieldset><p className="users-roles-note">Los permisos se suman según los roles seleccionados. Puedes configurar sus acciones en Roles y accesos.</p>
   {mutation.isError && <p className="users-alert" role="alert">{message?.errors ? Object.values(message.errors).flat()[0] : message?.title ?? 'No se pudo guardar. Verifica los datos e inténtalo de nuevo.'}</p>}
   <footer><button type="button" disabled={mutation.isPending} onClick={close}>Cancelar</button><button type="submit" disabled={mutation.isPending || catalog.isError || !!user && (!assigned.data || assigned.data.protegido || !assigned.data.activo) || values.length === 0}>{mutation.isPending ? 'Guardando…' : user ? 'Guardar roles' : 'Crear cuenta'}</button></footer>
  </form>
 </dialog>
}
