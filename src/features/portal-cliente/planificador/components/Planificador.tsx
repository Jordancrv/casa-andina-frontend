export const Planificador = () => {
  return (
    <div className="planificador-container p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Motor de Recomendación</h2>
      <p className="text-gray-600 mb-6">
        Te ayudamos a encontrar la mejor opción según tu presupuesto y clima.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <p>Presupuesto: <span>$200</span></p>
          <p>Clima: <span>Soleado</span></p>
        </div>
        <div className="p-4 border rounded">
          <p>Hotel sugerido: <span>Hotel Andino</span></p>
          <p>Precio: <span>$180/noche</span></p>
        </div>
      </div>
    </div>
  )
}