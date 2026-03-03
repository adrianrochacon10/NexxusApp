import { useState, useEffect } from 'react'
import { fetchSalesHistory, calculateDailyTotal } from '../services/salesService'

/**
 * Hook de Ventas
 * Maneja: historial de ventas, reportes, análisis
 */
export function useSales(isAuthenticated) {
  const [salesHistory, setSalesHistory] = useState([])
  const [dailyTotal, setDailyTotal] = useState(0)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar historial de ventas
  useEffect(() => {
    if (!isAuthenticated) return

    const loadSales = async () => {
      try {
        setLoading(true)
        const history = await fetchSalesHistory()
        setSalesHistory(history)

        // Calcular total del día
        const total = calculateDailyTotal(history)
        setDailyTotal(total)

        // Top 5 productos vendidos
        const top = history
          .reduce((acc, sale) => {
            const existing = acc.find(s => s.productId === sale.productId)
            if (existing) {
              existing.count += 1
            } else {
              acc.push({ productId: sale.productId, count: 1, ...sale })
            }
            return acc
          }, [])
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setTopProducts(top)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [isAuthenticated])

  return {
    salesHistory,
    dailyTotal,
    topProducts,
    loading,
    error
  }
}
