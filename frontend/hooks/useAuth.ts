"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { tokenStorage } from "@/lib/token"
import { loginAdmin, type LoginResponse } from "@/services/administradores"

/** Tiempo tras quitar la pantalla de login (commit) antes de mostrar el toast */
const TOAST_AFTER_LOGIN_CLOSE_MS = 1000

export interface AuthSession {
  idAdmin:        number
  idRol:          number
  nombreRol:      string
  nombreCompleto: string
  email:          string
  token:          string
}

/**
 * Hook global de autenticación.
 * Centraliza login/logout y expone el estado de sesión para toda la app.
 * Usa el mismo mecanismo de tokenStorage (localStorage) ya establecido.
 */
export function useAuth() {
  const [session, setSession]           = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading]       = useState(true)   // true mientras hidrata desde localStorage
  const [isAuthenticated, setIsAuth]    = useState(false)
  /** Solo true cuando el usuario acaba de pasar por `login()` (no hidratación con token). */
  const pendingLoginToastRef = useRef(false)

  /** Al montar, hidrata la sesión desde localStorage si el token existe */
  useEffect(() => {
    const token = tokenStorage.get()
    if (token) {
      try {
        // Decodificar el payload del JWT (sin verificar firma - solo para datos de display)
        const payload = JSON.parse(atob(token.split(".")[1]))
        const now     = Math.floor(Date.now() / 1000)

        if (payload.exp && payload.exp < now) {
          // Token expirado — limpiar
          tokenStorage.clear()
        } else {
          // Token vigente — restaurar sesión
          setSession({
            idAdmin:        payload.idAdmin,
            idRol:          payload.idRol,
            nombreRol:      payload.nombreRol      ?? "Administrador",
            nombreCompleto: payload.nombreCompleto ?? "",
            email:          payload.email          ?? "",
            token,
          })
          setIsAuth(true)
        }
      } catch {
        // Token malformado — limpiar
        tokenStorage.clear()
      }
    }
    setIsLoading(false)
  }, [])

  /**
   * Toast de éxito un tiempo fijo después de que React ya dejó `isAuthenticated`
   * (pantalla de login desmontada). Evita depender de `await` en el mismo tick que `setState`.
   */
  useEffect(() => {
    if (!isAuthenticated || !pendingLoginToastRef.current) return

    const id = window.setTimeout(() => {
      pendingLoginToastRef.current = false
      toast.success("Inicio correcto", {
        duration: 3200,
        className: "border border-border/70 bg-popover text-popover-foreground shadow-md",
      })
    }, TOAST_AFTER_LOGIN_CLOSE_MS)

    return () => window.clearTimeout(id)
  }, [isAuthenticated])

  /** Login: llama al endpoint existente POST /administradores/login */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res: LoginResponse = await loginAdmin(email.trim().toLowerCase(), password)
    tokenStorage.set(res.token)
    pendingLoginToastRef.current = true
    setSession({
      idAdmin:        res.admin.idAdmin,
      idRol:          res.admin.idRol,
      nombreRol:      res.admin.nombreRol,
      nombreCompleto: res.admin.nombreCompleto,
      email:          res.admin.email,
      token:          res.token,
    })
    setIsAuth(true)
  }, [])

  /** Logout: limpia token y sesión */
  const logout = useCallback(() => {
    pendingLoginToastRef.current = false
    tokenStorage.clear()
    setSession(null)
    setIsAuth(false)
  }, [])

  /**
   * Actualiza datos de display de la sesión sin re-login.
   * Usar tras un PUT exitoso al editar nombre/email del perfil.
   */
  const updateSession = useCallback((patch: Partial<Pick<AuthSession, "nombreCompleto" | "email">>) => {
    setSession((prev) => prev ? { ...prev, ...patch } : prev)
  }, [])

  return { session, isAuthenticated, isLoading, login, logout, updateSession }
}
