import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/shared/lib/api'

export function PasswordDialog({ user, close, onSaved }: { user: { usuarioId: number; nombre: string }; close: () => void; onSaved: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const valid = password.length >= 10 && password.length <= 72 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)
  const mutation = useMutation({ mutationFn: () => api.put(`/usuarios/${user.usuarioId}/contrasena`, { contrasena: password }), onSuccess: onSaved })
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  const message = axios.isAxiosError(mutation.error) ? mutation.error.response?.data?.detail || mutation.error.response?.data?.title : null
  return <dialog ref={ref} className="users-native-dialog users-confirm-dialog" aria-labelledby="password-title" onCancel={e => { e.preventDefault(); if (!mutation.isPending) close() }}>
    <form className="users-edit users-personal-form" onSubmit={e => { e.preventDefault(); if (valid && password === confirmation) mutation.mutate() }}>
      <header><div><p>ADMINISTRACIÓN DE USUARIOS</p><h2 id="password-title">Cambiar contraseña</h2></div><button type="button" onClick={close} disabled={mutation.isPending} aria-label="Cerrar">×</button></header>
      <p>Establece una nueva contraseña para <strong>{user.nombre}</strong>.</p>
      <label>Nueva contraseña<input required autoComplete="new-password" type={visible ? 'text' : 'password'} minLength={10} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Confirmar contraseña<input required autoComplete="new-password" type={visible ? 'text' : 'password'} minLength={10} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <label className="users-show-password"><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Mostrar contraseñas</label>
      <p>Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo.</p>
      {confirmation && confirmation !== password && <p className="users-alert" role="alert">Las contraseñas no coinciden.</p>}
      {mutation.isError && <p className="users-alert" role="alert">{message || 'No se pudo actualizar la contraseña.'}</p>}
      <footer><button type="button" onClick={close} disabled={mutation.isPending}>Cancelar</button><button type="submit" disabled={mutation.isPending || !valid || password !== confirmation}>{mutation.isPending ? 'Guardando…' : 'Guardar contraseña'}</button></footer>
    </form>
  </dialog>
}
