import { ShoppingCart } from 'lucide-react'

/**
 * Componente: Tarjeta de Producto
 * Muestra información y botón de venta
 */
export default function ProductCard({ 
  product, 
  onSell = () => {},
  isLoading = false 
}) {
  const {
    _id,
    name,
    variant,
    price,
    stock,
    category
  } = product

  // Determinar color del stock basado en cantidad
  const getStockColor = () => {
    if (stock > 5) return 'text-emerald-400'
    if (stock > 0) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStockBg = () => {
    if (stock > 5) return 'bg-emerald-950/30 border-emerald-500/30'
    if (stock > 0) return 'bg-amber-950/30 border-amber-500/30'
    return 'bg-red-950/30 border-red-500/30'
  }

  const handleClick = async () => {
    if (stock <= 0 || isLoading) return
    await onSell(_id)
  }

  return (
    <div className="group h-full backdrop-blur-sm bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
      
      {/* HEADER CARD */}
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
        <p className="text-xs text-slate-400">{variant}</p>
        {category && (
          <p className="text-xs text-violet-400 mt-1">📂 {category.name}</p>
        )}
      </div>

      {/* BODY CARD */}
      <div className="p-4 space-y-3">
        
        {/* PRECIO */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Precio</span>
          <span className="text-lg font-bold text-white">
            ${price.toFixed(2)}
          </span>
        </div>

        {/* STOCK */}
        <div className={`px-3 py-2 rounded-lg border ${getStockBg()}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Stock</span>
            <span className={`text-sm font-semibold ${getStockColor()}`}>
              {stock} unidades
            </span>
          </div>
        </div>

        {/* BOTÓN VENDER */}
        <button
          onClick={handleClick}
          disabled={stock <= 0 || isLoading}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : stock > 0 ? (
            <>
              <ShoppingCart className="w-4 h-4" />
              Vender
            </>
          ) : (
            '❌ Sin Stock'
          )}
        </button>
      </div>
    </div>
  )
}
