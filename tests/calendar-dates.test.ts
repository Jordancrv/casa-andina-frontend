import test from 'node:test'
import assert from 'node:assert/strict'
import { containsStay, dateKey, monthDays, parseDate } from '../src/features/portal-cliente/calendario/calendar-dates.ts'

test('la estadía incluye la entrada y excluye la salida, incluso al cambiar de año', () => {
  assert.equal(containsStay('2026-12-30T00:00:00', '2027-01-02T00:00:00', '2026-12-30'), true)
  assert.equal(containsStay('2026-12-30', '2027-01-02', '2027-01-01'), true)
  assert.equal(containsStay('2026-12-30', '2027-01-02', '2027-01-02'), false)
  assert.equal(containsStay('2026-12-30', '2027-01-02', '2026-12-29'), false)
})
test('la cuadrícula comienza en lunes y contempla febrero bisiesto', () => {
  const days = monthDays(new Date(2028, 1, 1, 12))
  assert.equal(days.length, 42)
  assert.equal(days[0].getDay(), 1)
  assert.equal(dateKey(days[0]), '2028-01-31')
  assert.equal(days.some(d => dateKey(d) === '2028-02-29'), true)
})
test('las fechas de reserva conservan el día de calendario sin conversión UTC', () => {
  assert.equal(dateKey(parseDate('2026-10-27T00:00:00')), '2026-10-27')
})
