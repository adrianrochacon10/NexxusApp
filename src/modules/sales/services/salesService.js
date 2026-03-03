import { API_URL } from "../../../common/utils/constants"

/**
 * Servicios de Ventas
 * Queries y reportes de historial de ventas
 */

export async function fetchSalesHistory(days = 1) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const response = await fetch(`${API_URL}/sales/history?days=${days}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Si el endpoint no existe aún, retornar array vacío
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.warn('Sales history not available:', error.message)
    return []
  }
}

export function calculateDailyTotal(salesHistory) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return salesHistory
    .filter(sale => {
      const saleDate = new Date(sale.createdAt)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    })
    .reduce((sum, sale) => sum + (sale.amount || 0), 0)
}

export function calculateTopProducts(salesHistory, limit = 5) {
  const productTotals = {}

  salesHistory.forEach(sale => {
    if (!productTotals[sale.productId]) {
      productTotals[sale.productId] = {
        productId: sale.productId,
        productName: sale.productName,
        count: 0,
        totalAmount: 0
      }
    }
    productTotals[sale.productId].count += 1
    productTotals[sale.productId].totalAmount += sale.amount || 0
  })

  return Object.values(productTotals)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function generateDailyReport() {
  try {
    const history = await fetchSalesHistory(1)
    const total = calculateDailyTotal(history)
    const topProducts = calculateTopProducts(history)

    return {
      date: new Date().toLocaleDateString(),
      totalSales: history.length,
      totalRevenue: total,
      topProducts,
      history
    }
  } catch (error) {
    throw new Error('Error generating report: ' + error.message)
  }
}
