import { Button } from '@/shared/ui/Button'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Casa Andina</h1>
      <p className="text-gray-600 mb-8">
        Plataforma de reservas hoteleras
      </p>
      <Button variant="primary">Entrar al Sistema</Button>
    </div>
  )
}