import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'

interface Contacto { tipoContacto: string; valor: string; esPrincipal: boolean }
function message(error: unknown) { return (error as { response?: { data?: { title?: string } } })?.response?.data?.title || 'No se pudo guardar el cambio. Inténtalo nuevamente.' }

export function CorreosPerfil({ contactos, correoAcceso }: { contactos: Contacto[]; correoAcceso: string }) {
 const { usuario, logout } = useAuth()
 const navigate = useNavigate()
 const client = useQueryClient()
 const [nuevo, setNuevo] = useState('')
 const [acceso, setAcceso] = useState('')
 const [password, setPassword] = useState('')
 const [editAccess, setEditAccess] = useState(false)
 const [notice, setNotice] = useState('')
 const correos = contactos.filter(c => c.tipoContacto === 'Correo').sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
 const refresh = async () => { await client.invalidateQueries({ queryKey: ['perfil', usuario?.token] }) }
 const add = useMutation({ mutationFn: async () => await api.post('/perfil/correos', { correo: nuevo }), onSuccess: async () => { setNuevo(''); setNotice('Correo agregado.'); await refresh() } })
 const principal = useMutation({ mutationFn: async (correo: string) => await api.put('/perfil/correo-principal', { correo }), onSuccess: async () => { setNotice('Correo principal actualizado.'); await refresh() } })
 const change = useMutation({ mutationFn: async () => await api.put('/perfil/correo-acceso', { correo: acceso, password }), onSuccess: () => { logout(); navigate('/login', { replace: true, state: { correoActualizado: true } }) } })
 const busy = add.isPending || principal.isPending || change.isPending
 const submit = (event: FormEvent) => { event.preventDefault(); setNotice(''); add.mutate() }
 return <section className="profile-emails" aria-label="Administración de correos">
  <div className="profile-access-row"><div><span>Correo de acceso</span><strong>{correoAcceso}</strong></div><button type="button" disabled={busy} onClick={() => { setEditAccess(value => !value); setAcceso(''); setPassword(''); change.reset() }}>{editAccess ? 'Cancelar' : 'Cambiar correo'}</button></div>
  {editAccess && <form className="profile-email-form profile-access-form" onSubmit={e => { e.preventDefault(); change.mutate() }}><label>Nuevo correo de acceso<input required type="email" maxLength={150} value={acceso} onChange={e => setAcceso(e.target.value)} autoComplete="email" /></label><label>Contraseña actual<input required type="password" maxLength={72} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label><p>Tras guardar, deberás iniciar sesión con el nuevo correo. El correo no se verifica automáticamente.</p>{change.isError && <p className="profile-email-error" role="alert">{message(change.error)}</p>}<button type="submit" disabled={busy}>Guardar correo de acceso</button></form>}
  <div className="profile-contact-heading"><h3>Correos de contacto</h3><p>El principal se usa como referencia de contacto. El envío automático de notificaciones aún no está habilitado.</p></div>
  {correos.length === 0 ? <p className="profile-empty">Aún no has agregado correos de contacto.</p> : <ul className="profile-email-list">{correos.map(c => <li key={c.valor}><div><strong>{c.valor}</strong>{c.esPrincipal && <span>Principal</span>}</div>{!c.esPrincipal && <button type="button" disabled={busy} onClick={() => { setNotice(''); principal.mutate(c.valor) }}>Hacer principal</button>}</li>)}</ul>}
  <form className="profile-email-form profile-add-email" onSubmit={submit}><label>Agregar correo de contacto<input required type="email" maxLength={150} value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="nombre@correo.com" /></label><button type="submit" disabled={busy}>{add.isPending ? 'Guardando…' : 'Agregar correo'}</button></form>
  {notice && <p className="profile-email-success" role="status">{notice}</p>}{(add.isError || principal.isError) && <p className="profile-email-error" role="alert">{message(add.error || principal.error)}</p>}
 </section>
}
