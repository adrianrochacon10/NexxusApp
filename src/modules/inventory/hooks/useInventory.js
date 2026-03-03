import { useState, useEffect } from 'react'
import { 
  fetchProducts, 
  fetchCategories, 
  sellProduct 
} from '../services/inventoryService'

/**
 * Hook de Inventario
 * Maneja: productos, categorías, filtrado, ventas
 */
export function useInventory(isAuthenticated) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar productos y categorías
  useEffect(() => {
    if (!isAuthenticated) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ])
        
        setProducts(productsData)
        setCategories(categoriesData)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error loading inventory:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // Manejar venta de producto (feedback optimista)
  const handleSell = async (productId) => {
    try {
      // 1. FEEDBACK OPTIMISTA: actualizar UI inmediatamente
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === productId
            ? { ...p, stock: Math.max(0, p.stock - 1) }
            : p
        )
      )

      // 2. BACKEND: enviar en background
      const result = await sellProduct(productId)

      // 3. Si falla, revertir
      if (!result.success) {
        throw new Error(result.message || 'Error al registrar venta')
      }

      setError(null)
      return true
    } catch (err) {
      // REVERTIR: recargar datos del backend
      const productsData = await fetchProducts()
      setProducts(productsData)
      setError(err.message)
      return false
    }
  }

  // Refrescar todos los datos
  const refreshInventory = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar productos por categoría
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?._id === selectedCategory)
    : products

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    handleSell,
    refreshInventory
  }
}
