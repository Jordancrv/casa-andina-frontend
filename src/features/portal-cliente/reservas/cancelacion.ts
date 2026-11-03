export function limiteCancelacion(fechaEntrada: string): number {
  // 10:00 en Perú equivale a 15:00 UTC. Se opera en UTC para no depender del navegador.
  return Date.parse(`${fechaEntrada.slice(0, 10)}T15:00:00Z`) - 2 * 24 * 60 * 60 * 1000
}
