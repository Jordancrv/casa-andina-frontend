export const Chatbot = () => {
  return (
    <div className="chatbot-container p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Asistente Virtual</h2>
      <div className="h-96 bg-gray-100 rounded overflow-hidden">
        <p className="p-4">Escribe tu consulta...</p>
      </div>
      <div className="p-4 border-t">
        <input
          type="text"
          className="w-full p-2 rounded border"
          placeholder="Escribe un mensaje..."
        />
      </div>
    </div>
  )
}