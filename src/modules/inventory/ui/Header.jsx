import { useState } from 'react'
import { Menu, X } from 'lucide-react'

/**
 * Componente: Header Sticky
 * Muestra título, categorías y filtrado
 */
export default function Header({ 
  categories = [], 
  selectedCategory = null, 
  onSelectCategory = () => {} 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-violet-500/20">
      <div className="container mx-auto px-4">
        
        {/* FILA 1: Logo + Menu */}
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛍️</div>
            <div>
              <h1 className="text-xl font-bold text-white">NexuStore</h1>
              <p className="text-xs text-slate-400">Sistema de Inventario</p>
            </div>
          </div>

          {/* BURGER MENU (MOBILE) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-300 hover:text-white transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* FILA 2: Categorías (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 pb-4 overflow-x-auto">
          {/* BOTÓN "TODOS" */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === null
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            📊 Todos
          </button>

          {/* CATEGORÍAS */}
          {categories.map(category => (
            <button
              key={category._id || category.id}
              onClick={() => onSelectCategory(category._id || category.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === (category._id || category.id)
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* MENU MOBILE */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            <button
              onClick={() => {
                onSelectCategory(null)
                setIsMobileMenuOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === null
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800/50 text-slate-300'
              }`}
            >
              📊 Todos
            </button>

            {categories.map(category => (
              <button
                key={category._id || category.id}
                onClick={() => {
                  onSelectCategory(category._id || category.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === (category._id || category.id)
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800/50 text-slate-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
