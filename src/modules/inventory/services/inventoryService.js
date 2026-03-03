import { API_URL } from "../../../common/utils/constants"


/**
 * Servicios de Inventario
 * CRUD de productos y categorías
 */

export async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al cargar productos')
    }

    const data = await response.json()
    return data.data || data
  } catch (error) {
    throw new Error(error.message || 'Error al cargar productos')
  }
}

export async function fetchCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al cargar categorías')
    }

    const data = await response.json()
    return data.data || data
  } catch (error) {
    throw new Error(error.message || 'Error al cargar categorías')
  }
}

export async function sellProduct(productId) {
  try {
    const response = await fetch(`${API_URL}/sell/${productId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al registrar venta'
      }
    }

    return {
      success: true,
      data: data.data
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error en conexión'
    }
  }
}

export async function getProductById(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Producto no encontrado')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    throw new Error(error.message)
  }
}

export async function updateProduct(productId, updates) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Error al actualizar producto')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    throw new Error(error.message)
  }
}
