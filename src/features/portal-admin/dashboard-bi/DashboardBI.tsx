export const DashboardBI = () => {
  return (
    <div className="dashboard-bi p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Panel de Control - Business Intelligence</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded bg-blue-50">
          <p className="text-3xl font-bold text-blue-600">1,245</p>
          <p className="text-sm text-gray-500">Total Hoteles</p>
        </div>
        <div className="p-4 border rounded bg-green-50">
          <p className="text-3xl font-bold text-green-600">890</p>
          <p className="text-sm text-gray-500">Reservas Activas</p>
        </div>
        <div className="p-4 border rounded bg-purple-50">
          <p className="text-3xl font-bold text-purple-600">$45,230</p>
          <p className="text-sm text-gray-500">Ingresos Mensuales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-3">Ocupación por Mes</h3>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-3">Ingresos por Hotel</h3>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}