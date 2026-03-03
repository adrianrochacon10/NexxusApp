import { AlertCircle, RotateCcw } from 'lucide-react'

/**
 * Componente: Error Boundary
 * Maneja errores genéricos
 */
export default function ErrorBoundary({ error = null, onRetry = () => {} }) {
  if (!error) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-2xl p-8 shadow-2xl text-center">
          
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-600/20 rounded-full border border-red-500/50">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">⚠️ Error</h2>
          <p className="text-slate-300 mb-6">
            {error}
          </p>

          <button
            onClick={onRetry}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reintentar
          </button>

          <p className="text-xs text-slate-500 mt-4">
            Si el problema persiste, contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}
