export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'cliente'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}