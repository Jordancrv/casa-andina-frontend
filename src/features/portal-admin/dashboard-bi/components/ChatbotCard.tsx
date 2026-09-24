/**
 * ChatbotCard.tsx
 * Panel de métricas del Asistente IA con badge de estado.
 */

import type { ChatbotMetricasDto } from '@/shared/types/global.types'

interface ChatbotCardProps {
  metricas: ChatbotMetricasDto
}

export function ChatbotCard({ metricas }: ChatbotCardProps) {
  const {
    consultasRealizadas,
    reservasGeneradas,
    tasaConversionPct,
    presupuestoMasConsultado,
    climaMasConsultado,
  } = metricas

  return (
    <div className="db-chatbot" role="region" aria-label="Asistente IA — métricas">
      <div className="db-list">
        <div className="db-list__row">
          <span className="db-list__label">Consultas Realizadas</span>
          <span className="db-list__mono">{consultasRealizadas.toLocaleString('es-PE')}</span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Reservas Generadas</span>
          <span className="db-list__mono">{reservasGeneradas}</span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Tasa De Conversión</span>
          <span className="db-list__mono db-list__mono--highlight">
            {tasaConversionPct.toFixed(1)}%
          </span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Presupuesto Top</span>
          <span className="db-list__mono">{presupuestoMasConsultado}</span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Clima Más Consultado</span>
          <span className="db-list__mono">{climaMasConsultado}</span>
        </div>
      </div>
    </div>
  )
}
