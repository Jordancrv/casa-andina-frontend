import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeRoomPhoto, seasonForDate, weatherCondition, weatherScene } from '../src/features/portal-cliente/chatbot/travel-weather.ts'

test('No interpreta un código ausente o desconocido como sol', () => {
  for (const code of [undefined, null, 7, 999]) assert.equal(weatherCondition(code).kind, 'unknown')
  assert.equal(weatherCondition(0).kind, 'sun')
  assert.equal(weatherCondition(2).kind, 'partly')
  assert.equal(weatherCondition(3).kind, 'cloud')
})
test('Distingue lluvia, nieve, niebla y tormenta usando el código del proveedor', () => {
  assert.equal(weatherCondition(61).kind, 'rain')
  assert.equal(weatherCondition(71).kind, 'snow')
  assert.equal(weatherCondition(45).kind, 'fog')
  assert.equal(weatherCondition(95).kind, 'storm')
})
test('La escena cambia con la temperatura, pero no inventa precipitación', () => {
  assert.equal(weatherScene('sun', 29), 'sunny')
  assert.equal(weatherScene('sun', 19), 'breezy')
  assert.equal(weatherScene('sun', 10), 'frost')
  assert.equal(weatherScene('cloud', 12), 'frost')
  assert.equal(weatherScene('rain', 28), 'rain')
  assert.equal(weatherScene('storm', 8), 'storm')
  assert.equal(weatherScene('snow', 2), 'snow')
  assert.equal(weatherScene('fog', 12), 'mist')
  assert.equal(weatherScene('unknown', 30), 'neutral')
  assert.equal(weatherScene('unknown', 2), 'neutral')
  assert.equal(weatherScene('sun', Number.NaN), 'neutral')
})
test('La referencia estacional cambia por meses del hemisferio sur', () => {
  assert.equal(seasonForDate('2026-10-27'), 'Primavera')
  assert.equal(seasonForDate('2026-12-01'), 'Verano')
  assert.equal(seasonForDate('2027-02-28'), 'Verano')
  assert.equal(seasonForDate('2027-03-01'), 'Otoño')
  assert.equal(seasonForDate('2027-06-01'), 'Invierno')
  assert.equal(seasonForDate('2027-09-01'), 'Primavera')
})
test('Las fotos admiten rutas locales y web; rechazan esquemas ejecutables y credenciales', () => {
  assert.equal(safeRoomPhoto(null), null)
  assert.equal(safeRoomPhoto('  '), null)
  assert.equal(safeRoomPhoto('javascript:alert(1)'), null)
  assert.equal(safeRoomPhoto('data:image/svg+xml,test'), null)
  assert.equal(safeRoomPhoto('//example.test/room.jpg'), null)
  assert.equal(safeRoomPhoto('/\\example.test/room.jpg'), null)
  assert.equal(safeRoomPhoto('https://user:password@example.test/room.jpg'), null)
  assert.equal(safeRoomPhoto('/images/room.jpg'), '/images/room.jpg')
  assert.equal(safeRoomPhoto(' https://example.test/room.jpg '), 'https://example.test/room.jpg')
})
