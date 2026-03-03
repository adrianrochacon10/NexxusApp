import { useState, useEffect } from 'react'
import { checkAuthStatus, activateDevice } from '../services/authService'

/**
 * Hook de Autenticación
 * Maneja: verificación de autenticación, activación de dispositivo
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar autenticación al montar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuth = await checkAuthStatus()
        setIsAuthenticated(isAuth)
        setError(null)
      } catch (err) {
        setIsAuthenticated(false)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Función para activar dispositivo
  const activate = async (activationKey) => {
    try {
      setLoading(true)
      await activateDevice(activationKey)
      setIsAuthenticated(true)
      setError(null)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Función para logout
  const logout = async () => {
    try {
      setLoading(true)
      // Aquí iría la lógica de logout (borrar cookie)
      setIsAuthenticated(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    isAuthenticated,
    loading,
    error,
    activate,
    logout
  }
}
