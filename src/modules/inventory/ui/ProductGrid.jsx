import { Package } from 'lucide-react'
import ProductCard from './ProductCard'

/**
 * Componente: Grid de Productos
 * Renderiza lista de tarjetas de productos
 */
export default function ProductGrid({ 
  products = [], 
  selectedCategory = null,
  onSell = () => {},
  isLoading = false 
}) {
  
  // Si no hay productos
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Sin productos disponibles
        </h2>
        <p className="text-slate-400 max-w-md">
          {selectedCategory 
            ? 'No hay productos en esta categoría'
            : 'Importa productos para comenzar a vender'
          }
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* CONTADOR */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {isLoading 
            ? '🔄 Cargando productos...' 
            : `📦 ${products.length} ${products.length === 1 ? 'producto' : 'productos'}`
          }
        </h2>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard
            key={product._id || product.id}
            product={product}
            onSell={onSell}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* LOADING SKELETON (FUTURO) */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-800/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  )
}
