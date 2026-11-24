import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'
import './memoria-viaje.css'

interface Memoria { playa: boolean; evitarLluvia: boolean }
export function MemoriaViaje({ sugeridas }: { sugeridas?: Memoria }) {
  const { usuario } = useAuth()
  const cache = useQueryClient()
  const key = ['preferencias-viaje', usuario?.token]
  const memoria = useQuery({ queryKey: key, queryFn: async () => await api.get('/chatbot/preferencias') as unknown as Memoria })
  const guardar = useMutation({
    mutationFn: (datos: Memoria) => api.put('/chatbot/preferencias', datos),
    onSuccess: (_, datos) => cache.setQueryData(key, datos),
  })
  if (!memoria.data) return sugeridas ? null : <p>{memoria.isError ? 'No se pudieron cargar tus preferencias.' : 'Cargando preferencias…'}</p>
  const datos = memoria.data
  const opciones = ([['playa', 'Destinos con playa cercana'], ['evitarLluvia', 'Destinos con menos lluvia']] as const)
    .filter(([campo]) => !sugeridas || (sugeridas[campo] && !datos[campo]))
  if (!opciones.length) return null
  return <div className="ca-memory"><p>{sugeridas ? '¿Quieres recordar estas preferencias para otros viajes?' : 'Elige qué quieres que el asistente recuerde al iniciar un viaje.'}</p>
    {opciones.map(([campo, nombre]) => <label className="ca-memory-option" key={campo}><input type="checkbox" checked={datos[campo]} disabled={guardar.isPending}
      onChange={event => guardar.mutate({ ...datos, [campo]: event.target.checked })}/>{nombre}</label>)}
    {guardar.isError && <p role="alert">No se pudo guardar el cambio. Inténtalo otra vez.</p>}
  </div>
}

export function ValoracionViaje({ generadoEn, ciudad, continuar, ocupado }: { generadoEn: string; ciudad: string | null; continuar: (texto: string) => void; ocupado: boolean }) {
  const [motivo, setMotivo] = useState('')
  const guardar = useMutation({ mutationFn: (util: boolean) => api.put('/chatbot/valoracion', { util, motivo, ciudad, planGeneradoEn: generadoEn }) })
  if (guardar.isSuccess) return <div className="ca-memory"><p role="status">Gracias por valorar estas recomendaciones.</p>{!guardar.variables && motivo.trim() &&
    <button type="button" disabled={ocupado} onClick={() => continuar(motivo.trim())}>Ajustar mi búsqueda con este comentario</button>}</div>
  return <div className="ca-memory"><p>¿Te sirvieron estas recomendaciones?</p>
    <label className="ca-memory-comment">Comentario (opcional)
      <textarea rows={2} maxLength={500} value={motivo} onChange={e => setMotivo(e.target.value)} />
    </label>
    <div className="ca-memory-actions">
      {[true, false].map(util => <button key={String(util)} type="button" disabled={guardar.isPending} onClick={() => guardar.mutate(util)}>{util ? 'Sí, me sirvieron' : 'No se ajustan a mi viaje'}</button>)}
    </div>
    {guardar.isError && <p role="alert">No se pudo guardar tu valoración. Inténtalo otra vez.</p>}
  </div>
}
