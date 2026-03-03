/**
 * Funciones asistentes de utilidad general
 */

/**
 * Formatea número a moneda
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Formatea fecha a formato legible
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('es-ES', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  return d.toISOString()
}

/**
 * Trunca texto a cierta longitud
 */
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

/**
 * Calcula descuento en porcentaje
 */
export function calculateDiscount(originalPrice, discountedPrice) {
  return ((originalPrice - discountedPrice) / originalPrice * 100).toFixed(2)
}

/**
 * Calcula margen de ganancia
 */
export function calculateMargin(cost, price) {
  if (cost <= 0) return 0
  return ((price - cost) / cost * 100).toFixed(2)
}

/**
 * Debounce function
 */
export function debounce(func, delay = 300) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Genera ID único
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Obtiene parámetro de URL
 */
export function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

/**
 * Ordena array de objetos
 */
export function sortBy(array, key, order = 'asc') {
  const sorted = [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

/**
 * Agrupa array por clave
 */
export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const groupKey = item[key]
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(item)
    return acc
  }, {})
}
