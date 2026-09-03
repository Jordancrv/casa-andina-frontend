import React from 'react'

export const Reservas = () => {
  const [reservas, setReservas] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchReservas = async () => {
      const response = await fetch('/api/reservas', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setReservas(data)
      setLoading(false)
    }
    fetchReservas()
  }, [])

  if (loading) return <p>Cargando reservas...</p>

  return (
    <div className="reservas-container p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Mis Reservas</h2>
      {reservas.length === 0 ? (
        <p>No tienes reservas activas</p>
      ) : (
        <ul className="space-y-4">
          {reservas.map((reserva) => (
            <li key={reserva.id} className="p-4 border rounded">
              <h3>{reserva.hotelNombre}</h3>
              <p>Fechas: {reserva.fechaInicio} - {reserva.fechaFin}</p>
              <p>Precio: ${reserva.precio}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}