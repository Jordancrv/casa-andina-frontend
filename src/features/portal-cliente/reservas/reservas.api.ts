export const getReservas = async () => {
  const response = await fetch('/api/reservas', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  return response.json()
}