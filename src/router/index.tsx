import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { LandingPage } from '@/features/landing'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<div><h1>Login</h1></div>} />
      <Route path="/admin" element={<div><h1>Panel Administrador</h1></div>} />
      <Route path="/cliente" element={<div><h1>Panel Cliente</h1></div>} />
    </>
  )
)