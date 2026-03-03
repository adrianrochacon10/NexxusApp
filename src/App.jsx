import './App.css'
import { useState, useEffect } from 'react'

// 🔐 MÓDULO: Autenticación
import { useAuth } from './modules/auth/hooks/useAuth'
import AccessDenied from './modules/auth/ui/AccessDenied'

// 📦 MÓDULO: Inventario
import { useInventory } from './modules/inventory/hooks/useInventory'
import Header from './modules/inventory/ui/Header'
import ProductGrid from './modules/inventory/ui/ProductGrid'
import ErrorBoundary from './modules/inventory/ui/ErrorBoundary'

// 📊 MÓDULO: Ventas (futuro)
import { useSales } from './modules/sales/hooks/useSales'

/**
 * ════════════════════════════════════════════════════════════════════
 * COMPONENTE RAÍZ: App.jsx
 * 
 * Orquestador principal de la aplicación
 * Maneja: Autenticación, Inventario, Ventas
 * ════════════════════════════════════════════════════════════════════
 */
function App() {
  // ═══════════════════════════════════════════════════════════════════
  // 🔐 CAPA 1: AUTENTICACIÓN
  // Verifica si el dispositivo está activado
  // ═══════════════════════════════════════════════════════════════════
  const { 
    isAuthenticated, 
    loading: authLoading, 
    error: authError 
  } = useAuth()

  // ═══════════════════════════════════════════════════════════════════
  // 📦 CAPA 2: INVENTARIO
  // Gestiona productos, categorías, filtrado y ventas
  // ═══════════════════════════════════════════════════════════════════
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading: inventoryLoading,
    error: inventoryError,
    handleSell,
    refreshInventory
  } = useInventory(isAuthenticated)

  // ═══════════════════════════════════════════════════════════════════
  // 📊 CAPA 3: VENTAS (FUTURO)
  // Datos de historial, reportes y análisis
  // ═══════════════════════════════════════════════════════════════════
  const {
    salesHistory,
    dailyTotal,
    topProducts
  } = useSales(isAuthenticated)

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 ESTADOS LOCALES DE LA APP
  // ═══════════════════════════════════════════════════════════════════
  const [appError, setAppError] = useState(null)
  const isLoading = authLoading || inventoryLoading

  // ═══════════════════════════════════════════════════════════════════
  // 📡 EFECTOS: Sincronización de Estados
  // ═══════════════════════════════════════════════════════════════════

  // Si hay error en inventario, mostrar en app
  useEffect(() => {
    if (isAuthenticated && inventoryError) {
      setAppError(inventoryError)
    }
  }, [inventoryError, isAuthenticated])

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 RENDER: Lógica Condicional basada en Estado
  // ═══════════════════════════════════════════════════════════════════

  // ❌ ESCENARIO 1: No autenticado
  if (!isAuthenticated && !authLoading) {
    return <AccessDenied />
  }

  // ⏳ ESCENARIO 2: Cargando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  // ⚠️ ESCENARIO 3: Error
  if (appError) {
    return (
      <ErrorBoundary 
        error={appError} 
        onRetry={refreshInventory} 
      />
    )
  }

  // ✅ ESCENARIO 4: RENDER PRINCIPAL
  // Autenticado + Datos listos + Sin errores
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: HEADER */}
      {/* Muestra logo, categorías y filtrado */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: CONTENIDO PRINCIPAL */}
      {/* Grid de productos en venta */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main className="container mx-auto px-4 py-8">
        <ProductGrid
          products={products}
          selectedCategory={selectedCategory}
          onSell={handleSell}
          isLoading={inventoryLoading}
        />
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: SIDEBAR DASHBOARD (FUTURO) */}
      {/* Se activará cuando agregues el módulo de reportes */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 
      <aside className="fixed right-0 top-16 w-80 bg-slate-900/80 border-l border-violet-500/20 p-6 max-h-[calc(100vh-64px)] overflow-y-auto">
        <SalesDashboard 
          salesHistory={salesHistory} 
          dailyTotal={dailyTotal}
          topProducts={topProducts}
        />
      </aside>
      */}
    </div>
  )
}

export default App
