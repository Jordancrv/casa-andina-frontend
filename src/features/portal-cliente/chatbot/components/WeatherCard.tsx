import { useState } from 'react'
import type { ClimaViaje } from '../chatbot.types'
import { peruToday } from '../travel-dates'
import { seasonForDate, weatherCondition, type WeatherKind } from '../travel-weather'

const dateLabel = (date: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
const weekday = (date: string) => new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

export function WeatherIcon({ kind }: { kind: WeatherKind }) {
  const sun = kind === 'sun' || kind === 'partly'
  return <svg className={`ca-weather-icon ca-weather-icon--${kind}`} viewBox="0 0 80 72" fill="none" aria-hidden="true">
    {sun && <g stroke="#E9A637" strokeWidth="3" strokeLinecap="round"><circle cx={kind === 'partly' ? 29 : 40} cy={kind === 'partly' ? 28 : 34} r="14" fill="#FFE4A5"/>{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M40 9v-5" transform={`rotate(${angle} 40 34)${kind === 'partly' ? ' translate(-11 -6)' : ''}`} />)}</g>}
    {!['sun', 'unknown'].includes(kind) && <path d="M22 51h37c18 0 17-26 1-27C55 7 31 10 28 28 9 25 7 51 22 51Z" fill={kind === 'storm' ? '#B2C4DF' : '#F7FBFF'} stroke="#9BBBD0" strokeWidth="2.5" />}
    {kind === 'rain' && <g stroke="#6E9DE0" strokeWidth="3" strokeLinecap="round"><path d="m26 58-3 7m17-7-3 7m17-7-3 7"/></g>}
    {kind === 'storm' && <path d="m43 43-10 16h10l-5 11 17-20H43l4-7" fill="#F8C66A"/>}
    {kind === 'snow' && <g fill="#80B1D6"><circle cx="27" cy="61" r="3"/><circle cx="43" cy="64" r="3"/><circle cx="58" cy="60" r="3"/></g>}
    {kind === 'fog' && <g stroke="#A3B9C2" strokeWidth="3" strokeLinecap="round"><path d="M17 59h45M24 66h30"/></g>}
    {kind === 'unknown' && <g stroke="#92A5B8" strokeWidth="3"><path d="M35 42V17a6 6 0 0 1 12 0v25a12 12 0 1 1-12 0Z"/><path d="M41 26v27"/><circle cx="41" cy="54" r="4" fill="#BFD9EF"/></g>}
  </svg>
}

export function WeatherCard({ clima, ciudad, entrada }: { clima: ClimaViaje; ciudad: string; entrada: string }) {
  const [selectedDate, setSelectedDate] = useState(clima.dias[0]?.fecha ?? '')
  const day = clima.dias.find(d => d.fecha === selectedDate) ?? clima.dias[0]
  const condition = weatherCondition(day?.codigoTiempo)
  const currentSeason = seasonForDate(peruToday())
  const tripSeason = seasonForDate(entrada)
  if (!day) return <section className="ca-weather-empty" aria-label={`Clima en ${ciudad}`}><WeatherIcon kind="unknown"/><div><strong>El clima también es parte del plan</strong><p>{clima.aviso}</p><span>Estación de referencia actual: {currentSeason.toLowerCase()} · no es un pronóstico.</span></div></section>
  const theme = ['rain', 'storm', 'cloud', 'fog'].includes(condition.kind) ? 'rainy' : condition.kind === 'snow' || day.maximaC < 16 ? 'cool' : condition.kind === 'unknown' ? 'neutral' : 'warm'
  return <section className={`ca-weather ca-weather--${theme}`} aria-label={`Pronóstico para tu viaje a ${ciudad}`}>
    <div className="ca-weather-heading"><span>EL CLIMA PARA TU ESCAPADA</span><span className="ca-weather-season">{currentSeason} ahora</span></div>
    <div className="ca-weather-current"><div><h4>{ciudad}</h4><p>Pronóstico · {dateLabel(day.fecha)}</p><div className="ca-weather-temperature">{Math.round(day.maximaC)}<span>°C</span></div><small>Máxima prevista · mínima {Math.round(day.minimaC)}°C</small></div><div className="ca-weather-condition"><WeatherIcon kind={condition.kind}/><span>{condition.label}</span></div></div>
    <div className="ca-weather-metrics"><span>↗ Máx. {Math.round(day.maximaC)}° · ↘ Mín. {Math.round(day.minimaC)}°</span><span><svg width="11" height="13" viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 1C5 4 1 7 1 10a5 5 0 0 0 10 0C11 7 7 4 6 1Z" stroke="currentColor" strokeWidth="1.5"/></svg> {day.probabilidadLluvia == null ? 'Lluvia sin datos' : `${Math.round(day.probabilidadLluvia)}% prob. de lluvia`}</span></div>
    <div className="ca-weather-days" aria-label="Elige un día del pronóstico">{clima.dias.map(d => <button key={d.fecha} type="button" aria-label={`Ver clima del ${dateLabel(d.fecha)}`} aria-pressed={d.fecha === day.fecha} onClick={() => setSelectedDate(d.fecha)}><span>{weekday(d.fecha)}</span><time dateTime={d.fecha}>{dateLabel(d.fecha)}</time><WeatherIcon kind={weatherCondition(d.codigoTiempo).kind}/><strong>{Math.round(d.maximaC)}° <small>{Math.round(d.minimaC)}°</small></strong><span>{d.probabilidadLluvia == null ? '— lluvia' : `${Math.round(d.probabilidadLluvia)}% lluvia`}</span></button>)}</div>
    {clima.estado === 'parcial' && <p className="ca-weather-coverage">Cobertura parcial · solo hay pronóstico para los días mostrados.</p>}
    <details className="ca-weather-source"><summary>Fuente, estación y cobertura</summary><p>{clima.aviso}</p><p>Estación actual de referencia: {currentSeason.toLowerCase()}. {tripSeason !== currentSeason && `Al inicio de tu viaje: ${tripSeason.toLowerCase()}. `}Referencia por meses del hemisferio sur; las condiciones varían según la región.</p>{clima.fuenteUrl && <a href={clima.fuenteUrl} target="_blank" rel="noreferrer">Open-Meteo ↗</a>}{clima.consultadoEn && <span> · Consultado {new Date(clima.consultadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}</details>
  </section>
}
