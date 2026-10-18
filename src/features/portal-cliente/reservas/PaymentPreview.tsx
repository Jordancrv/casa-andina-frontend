import type { MetodoPago } from './compra.types'

export function PaymentPreview({ method, amount }: { method?: MetodoPago; amount: number }) {
  const name = method?.nombre.toLowerCase() ?? ''
  const card = name.includes('tarjeta')
  const wallet = name.includes('yape') || name.includes('plin')
  const transfer = name.includes('transferencia')
  const total = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)

  return <section className="payment-preview" aria-label="Demostración de pago">
    <div className="payment-preview-top"><span className="payment-demo-badge">MODO DE PRUEBA</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></div>
    <h3>{method ? `Pago con ${method.nombre}` : 'Selecciona un método de pago'}</h3>
    {card ? <>
      <div className="payment-demo-card"><span>CASA ANDINA · DEMOSTRACIÓN</span><svg width="32" height="26" viewBox="0 0 32 26" fill="none" stroke="currentColor" aria-hidden="true"><rect x="1" y="1" width="30" height="24" rx="5" /><path d="M11 1v24M21 1v24M1 9h30M1 17h30" /></svg><strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; 0000</strong><div><span>TARJETA DE PRUEBA</span><span>MM / AA</span></div></div>
    </> : wallet ? <div className="payment-demo-wallet"><span className="payment-wallet-mark" aria-hidden="true">{name.includes('yape') ? 'Y' : 'P'}</span><strong>{method?.nombre} · demostración</strong><p>No necesitas escanear un QR ni abrir una aplicación. Confirma para registrar la simulación.</p></div>
      : transfer ? <div className="payment-demo-instructions"><strong>Transferencia de prueba</strong><p>No se mostrará una cuenta bancaria ni se solicitará una transferencia. Solo se registra el método seleccionado.</p></div>
        : <div className="payment-demo-instructions"><strong>{method ? 'Registro de pago simulado' : 'Método pendiente'}</strong><p>No necesitas entregar dinero. La confirmación registra una operación de prueba.</p></div>}
    <div className="payment-preview-total"><span>Importe de la simulación</span><strong>{total}</strong></div>
    <p className="payment-demo-disclaimer">Sin cobro real. No ingreses datos financieros personales.</p>
  </section>
}
