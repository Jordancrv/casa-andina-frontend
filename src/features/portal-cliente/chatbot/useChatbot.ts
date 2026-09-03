import { useState } from 'react'

export const useChatbot = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')

  const sendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setInput('')

    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message })
    })
    const data = await response.json()
    setMessages(prev => [...prev, { role: 'bot', content: data.response }])
  }

  return { messages, input, setInput, sendMessage }
}