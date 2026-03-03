import { API_URL } from "../../../common/utils/constants"

/**
 * Servicios de Autenticación
 * Comunica con backend
 */

export async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.authenticated === true
    }

    return false
  } catch (error) {
    console.error('Auth check failed:', error)
    return false
  }
}

export async function activateDevice(activationKey) {
  try {
    const response = await fetch(`${API_URL}/auth/activate/${activationKey}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Activación fallida')
    }

    return data
  } catch (error) {
    throw new Error(error.message || 'Error en activación')
  }
}

export async function logout() {
  try {
    // Limpiar cookie del lado del cliente
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    return true
  } catch (error) {
    console.error('Logout failed:', error)
    return false
  }
}
