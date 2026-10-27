import { useEffect, useRef, useState } from 'react'
import { addDays, nightsBetween, peruToday } from '../travel-dates'

export interface TripPreferences {
  ciudad: string
  entrada: string
  salida: string
  presupuesto: string
  adultos: string
}
const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const steps = ['Destino', 'Fechas', 'Presupuesto', 'Personas']

export function TripQuestions({ values, onChange, ciudades, catalogError, onComplete, onClose, canClose }: {
  values: TripPreferences; onChange: (value: TripPreferences) => void; ciudades: string[]
  catalogError: boolean; onComplete: () => void; onClose: () => void; canClose: boolean
}) {
  const [step, setStep] = useState(0)
  const [custom, setCustom] = useState(false)
  const questionHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { questionHeading.current?.focus({ preventScroll: true }) }, [step])
  const nights = nightsBetween(values.entrada, values.salida)
  const datesValid = values.entrada >= peruToday() && values.entrada <= addDays(peruToday(), 365) && nights >= 1 && nights <= 30
  const budgetValid = Number(values.presupuesto) >= 1 && Number(values.presupuesto) <= 10000
  const go = (next: number) => { setStep(next); setCustom(false) }
  const change = (key: keyof TripPreferences, value: string) => onChange({ ...values, [key]: value })
  const chooseDates = (start: string) => { onChange({ ...values, entrada: start, salida: addDays(start, 2) }); go(2) }
  const chooseAdults = (value: string) => { onChange({ ...values, adultos: value }); onComplete() }
  const today = peruToday()
  const day = new Date(`${today}T00:00:00Z`).getUTCDay()
  const friday = addDays(today, ((5 - day + 7) % 7))
  return <div className="ca-trip-question" aria-label="Preguntas rápidas para preparar tu viaje">
    <div className="ca-question-heading"><span className="ca-question-spark" aria-hidden="true">✦</span><span>Vamos a darle forma a tu viaje</span>{canClose && <button type="button" onClick={onClose} aria-label="Cerrar preguntas del viaje">×</button>}</div>
    <div className="ca-question-steps" aria-label="Pasos del viaje">{steps.map((label, i) => <button key={label} type="button" className={i === step ? 'is-current' : i < step ? 'is-done' : ''} disabled={i > step} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}><span>{i < step ? '✓' : i + 1}</span>{label}</button>)}</div>
    <div className="ca-question-body" key={step}>
      <p className="ca-question-count">PREGUNTA {step + 1} DE 4</p>
      <h3 ref={questionHeading} tabIndex={-1}>{['¿A dónde te gustaría escaparte?', '¿Cuándo nos vamos?', '¿Cuánto te gustaría gastar por noche?', '¿Cuántos adultos viajan?'][step]}</h3>
      <p>{['Elige una ciudad o déjame ayudarte a descubrir un destino.', 'Puedes elegir una escapada rápida o indicar tus propias fechas.', 'Buscaré una habitación dentro de ese límite, sin servicios adicionales.', 'Buscaremos una habitación con espacio para todos.'][step]}</p>
      {step === 0 && <><div className="ca-quick-answers">{ciudades.map(city => <button key={city} type="button" onClick={() => { change('ciudad', city); go(1) }}>⌖ {city}</button>)}<button className="ca-answer-featured" type="button" onClick={() => { change('ciudad', ''); go(1) }}>✦ Ayúdame a elegir</button></div>{catalogError && <p className="ca-question-help">Las ciudades no se cargaron, pero podemos buscar entre todos los destinos.</p>}</>}
      {step === 1 && <><div className="ca-quick-answers"><button type="button" onClick={() => chooseDates(addDays(today, 1))}>Desde mañana · 2 noches</button><button type="button" onClick={() => chooseDates(friday)}>Este fin de semana · {date(friday)}</button><button type="button" onClick={() => chooseDates(addDays(today, 7))}>La próxima semana</button><button type="button" className={custom ? 'is-selected' : ''} onClick={() => setCustom(true)}>Elegir mis fechas</button></div>{custom && <div className="ca-question-custom"><div className="ca-question-dates"><label>Entrada<input type="date" min={today} max={addDays(today, 365)} value={values.entrada} onChange={e => { const start = e.target.value; onChange({ ...values, entrada: start, salida: start && start >= values.salida ? addDays(start, 2) : values.salida }) }}/></label><label>Salida<input type="date" min={values.entrada ? addDays(values.entrada, 1) : today} max={values.entrada ? addDays(values.entrada, 30) : undefined} value={values.salida} onChange={e => change('salida', e.target.value)}/></label></div><button className="ca-question-next" type="button" disabled={!datesValid} onClick={() => go(2)}>Usar estas fechas →</button>{!datesValid && <p className="ca-question-help" role="status">Elige fechas desde hoy, con una estadía de 1 a 30 noches.</p>}</div>}</>}
      {step === 2 && <><div className="ca-quick-answers">{[250, 500, 800].map(amount => <button key={amount} type="button" onClick={() => { change('presupuesto', String(amount)); go(3) }}>Hasta {money(amount)}</button>)}<button type="button" onClick={() => setCustom(true)}>Otro presupuesto</button></div>{custom && <div className="ca-question-custom"><label>Máximo por noche (S/)<input type="number" min="1" max="10000" step="0.01" value={values.presupuesto} onChange={e => change('presupuesto', e.target.value)}/></label><button className="ca-question-next" type="button" disabled={!budgetValid} onClick={() => go(3)}>Este es mi presupuesto →</button>{!budgetValid && <p className="ca-question-help" role="status">El presupuesto debe estar entre S/ 1 y S/ 10,000 por noche.</p>}</div>}</>}
      {step === 3 && <><div className="ca-quick-answers">{[1, 2, 3, 4].map(count => <button key={count} type="button" onClick={() => chooseAdults(String(count))}>{count === 1 ? 'Solo yo' : `${count} adultos`}</button>)}<button type="button" onClick={() => setCustom(true)}>Más personas</button></div>{custom && <div className="ca-question-custom"><label>Adultos por habitación<select value={values.adultos} onChange={e => change('adultos', e.target.value)}>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>{i + 1} adultos</option>)}</select></label><button className="ca-question-next" type="button" onClick={onComplete}>¡Listo, sigamos! →</button></div>}</>}
      {step > 0 && <button type="button" className="ca-question-back" onClick={() => go(step - 1)}>← Volver a la pregunta anterior</button>}
    </div>
  </div>
}
