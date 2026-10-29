import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'
import { CorreosPerfil } from './CorreosPerfil'
import './perfil.css'

interface PerfilData {
 correo: string; fechaCreacion: string; ultimoAcceso: string | null; sede: string | null; tipoCuenta: string; tipoPersona: string
 nombres: string | null; apellidos: string | null; fechaNacimiento: string | null; genero: string | null; nacionalidad: string | null
 razonSocial: string | null; nombreComercial: string | null; roles: string[]
 documentos: { tipo: string; numero: string; esPrincipal: boolean }[]
 contactos: { tipoContacto: string; valor: string; esPrincipal: boolean }[]
}
interface PerfilHuesped { id: number; nombres: string; apellidos: string; dni: string; fechaNacimiento: string; sexo: string; correo: string; telefono: string | null }
const fecha = (value: string | null, dateOnly = false) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: dateOnly ? 'UTC' : 'America/Lima' }).format(new Date(dateOnly ? `${value.slice(0, 10)}T00:00:00Z` : /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z')) : 'No registrado'
function Campo({ titulo, valor }: { titulo: string; valor: string | null | undefined }) { return <div className="profile-field"><dt>{titulo}</dt><dd>{valor || 'No registrado'}</dd></div> }

export function Perfil() {
 const { usuario } = useAuth()
 const query = useQuery({ queryKey: ['perfil', usuario?.token], queryFn: async () => await api.get('/perfil') as PerfilData, enabled: !!usuario })
 const p = query.data
 const guests = useQuery({ queryKey: ['huespedes', usuario?.token], queryFn: async () => await api.get('/perfil/huespedes') as PerfilHuesped[], enabled: !!usuario && p?.tipoCuenta === 'Cliente' })
 const nombre = p?.tipoPersona === 'J' ? p.razonSocial : [p?.nombres, p?.apellidos].filter(Boolean).join(' ')
 return <div className="profile-page">
  <header className="profile-heading"><p>MI CUENTA</p><h1>Mi perfil</h1><span>Consulta los datos registrados en tu cuenta.</span></header>
  {query.isLoading && <p role="status">Cargando perfil…</p>}
  {query.isError && <div className="profile-error" role="alert">No se pudo cargar el perfil. <button onClick={() => void query.refetch()}>Reintentar</button></div>}
  {p && <><section className="profile-summary"><span className="profile-avatar" aria-hidden="true">{(nombre || usuario?.nombreCompleto || 'U').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()}</span><div><p>{p.tipoCuenta === 'Personal' ? 'PERSONAL DE LA SEDE' : 'CUENTA DE CLIENTE'}</p><h2>{nombre || usuario?.nombreCompleto}</h2><span>{p.tipoCuenta === 'Personal' ? p.sede || 'Sin sede asignada' : p.tipoPersona === 'J' ? 'Persona jurídica' : 'Persona natural'}</span></div></section>
   <div className="profile-grid"><section className="profile-card"><header><h2>{p.tipoPersona === 'J' ? 'Datos de la empresa' : 'Datos personales'}</h2><p>Información de identificación registrada.</p></header><dl>
    {p.tipoPersona === 'J' ? <><Campo titulo="Razón social" valor={p.razonSocial}/><Campo titulo="Nombre comercial" valor={p.nombreComercial}/></> : <><Campo titulo="Nombres" valor={p.nombres}/><Campo titulo="Apellidos" valor={p.apellidos}/><Campo titulo="Fecha de nacimiento" valor={fecha(p.fechaNacimiento, true)}/><Campo titulo="Sexo" valor={p.genero === 'M' ? 'Masculino' : p.genero === 'F' ? 'Femenino' : p.genero}/><Campo titulo="Nacionalidad" valor={p.nacionalidad}/></>}
    {p.documentos.length ? p.documentos.map((d, i) => <Campo key={`${d.tipo}-${i}`} titulo={d.tipo + (d.esPrincipal ? ' · principal' : '')} valor={d.numero}/>) : <Campo titulo="Documento" valor={null}/>}
   </dl></section><section className="profile-card"><header><h2>Cuenta y contacto</h2><p>Datos para acceder y recibir comunicaciones.</p></header><dl>{p.tipoCuenta !== 'Cliente' && <Campo titulo="Correo de acceso" valor={p.correo}/>}{p.contactos.filter(c => p.tipoCuenta !== 'Cliente' || c.tipoContacto !== 'Correo').map((c, i) => <Campo key={`${c.tipoContacto}-${i}`} titulo={`${c.tipoContacto}${c.esPrincipal ? ' Principal' : ''}`} valor={c.valor}/>)}<Campo titulo="Fecha de registro" valor={fecha(p.fechaCreacion)}/><Campo titulo="Último acceso" valor={fecha(p.ultimoAcceso)}/></dl>{p.tipoCuenta === 'Cliente' && <CorreosPerfil contactos={p.contactos} correoAcceso={p.correo} />}</section>
   {p.tipoCuenta === 'Personal' && <section className="profile-card profile-card-wide"><header><h2>Datos de trabajo</h2><p>Sede y roles asignados a tu cuenta.</p></header><dl><Campo titulo="Sede" valor={p.sede}/><Campo titulo="Roles" valor={p.roles.join(', ')}/></dl></section>}
   {p.tipoCuenta === 'Cliente' && <section className="profile-card profile-card-wide"><header><h2>Huéspedes guardados</h2><p>Disponibles para completar futuras reservas de tu cuenta.</p></header>{guests.isLoading ? <p>Cargando huéspedes…</p> : guests.isError ? <div className="profile-error" role="alert">No se pudieron cargar los huéspedes. <button onClick={() => void guests.refetch()}>Reintentar</button></div> : !guests.data?.length ? <p className="profile-empty">Aún no tienes huéspedes guardados. Se agregarán al confirmar una reserva.</p> : <div className="profile-guests">{guests.data.map(g => <article key={g.id}><h3>{g.nombres} {g.apellidos}</h3><dl><Campo titulo="DNI" valor={g.dni}/><Campo titulo="Nacimiento" valor={fecha(g.fechaNacimiento, true)}/><Campo titulo="Sexo" valor={g.sexo === 'F' ? 'Femenino' : g.sexo === 'M' ? 'Masculino' : g.sexo}/><Campo titulo="Correo" valor={g.correo}/><Campo titulo="Teléfono" valor={g.telefono}/></dl></article>)}</div>}</section>}</div></>}
 </div>
}
