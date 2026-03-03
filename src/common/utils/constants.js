/**
 * Constantes globales de la aplicación
 */

// URLs de API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Rutas principales
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  PRODUCTS: '/products',
  SALES: '/sales',
  SETTINGS: '/settings'
}

// Colores Cyberpunk Theme
export const COLORS = {
  // Fondos
  BG_PRIMARY: '#030712',      // slate-950
  BG_SECONDARY: '#0f172a',    // slate-900
  BG_TERTIARY: '#1e293b',     // slate-800

  // Acentos Neón
  NEON_VIOLET: '#7c3aed',     // violet-600
  NEON_PURPLE: '#a855f7',     // purple-500
  NEON_CYAN: '#06b6d4',       // cyan-500
  NEON_BLUE: '#3b82f6',       // blue-500

  // Estados
  SUCCESS: '#10b981',          // emerald-500
  WARNING: '#f59e0b',          // amber-500
  ERROR: '#ef4444',            // red-500
  NEUTRAL: '#64748b'           // slate-500
}

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'No autorizado. Por favor, activa el dispositivo.',
  NOT_FOUND: 'Recurso no encontrado.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  INVALID_KEY: 'Clave de activación inválida.',
  UNKNOWN_ERROR: 'Error desconocido. Intenta de nuevo.'
}

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  ACTIVATION_SUCCESS: '✅ Dispositivo activado correctamente',
  SALE_SUCCESS: '✅ Venta registrada',
  PRODUCT_UPDATED: '✅ Producto actualizado',
  CATEGORY_CREATED: '✅ Categoría creada'
}

// Configuración de timeouts
export const TIMEOUTS = {
  API_CALL: 10000,        // 10 segundos
  TOAST_NOTIFICATION: 5000 // 5 segundos
}

// Límites de paginación
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  MAX_ITEMS: 1000
}

// Información de la aplicación
export const APP_INFO = {
  NAME: 'NexuStore',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de Inventario y POS',
  AUTHOR: 'Tu Nombre',
  SUPPORT_EMAIL: 'support@nexustore.com'
}
