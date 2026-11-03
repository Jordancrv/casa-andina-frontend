import { test } from 'node:test'
import assert from 'node:assert/strict'
import { limiteCancelacion } from '../src/features/portal-cliente/reservas/cancelacion.ts'

test('límite a las 10 de Perú dos días antes, independiente de zona del navegador', () => {
  assert.equal(limiteCancelacion('2026-11-07'), Date.parse('2026-11-05T10:00:00-05:00'))
  assert.equal(limiteCancelacion('2026-11-07T00:00:00'), Date.parse('2026-11-05T15:00:00Z'))
})
test('cruza correctamente mes, año y año bisiesto', () => {
  assert.equal(new Date(limiteCancelacion('2027-01-01')).toISOString(), '2026-12-30T15:00:00.000Z')
  assert.equal(new Date(limiteCancelacion('2028-03-01')).toISOString(), '2028-02-28T15:00:00.000Z')
})
