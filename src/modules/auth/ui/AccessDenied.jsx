import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/**
 * Componente: Pantalla de Acceso Denegado
 * Permite activación con clave maestra
 */
export default function AccessDenied() {
  const [activationKey, setActivationKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { activate } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!activationKey.trim()) {
      setError('Por favor ingresa una clave')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      const success = await activate(activationKey)
      
      if (!success) {
        setError('Clave de activación inválida')
      }
    } catch (err) {
      setError(err.message || 'Error en activación')
    } finally {
      setIsLoading(false)
      setActivationKey('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* CARD */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-violet-500/20 rounded-2xl p-8 shadow-2xl">
          
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-violet-600/20 rounded-full border border-violet-500/50">
                <Lock className="w-8 h-8 text-violet-400" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">🛍️ NexuStore</h1>
            <p className="text-slate-300 text-sm">Sistema de Inventario</p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* DESCRIPCIÓN */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-300 text-sm text-center">
                🔒 Este dispositivo no está autorizado. Ingresa tu clave de activación para continuar.
              </p>
            </div>

            {/* INPUT */}
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-slate-200 mb-2">
                Clave de Activación
              </label>
              <input
                type="password"
                id="key"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="••••••••••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-50"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-3 bg-red-950/30 border border-red-500/50 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-500/25"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activando...
                </span>
              ) : (
                '🔓 Activar Dispositivo'
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-xs">
              ¿No tienes una clave? Contacta al administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
