# 📁 Estructura Modular - Frontend

## 🎯 Visión General

El frontend está organizado en **módulos independientes** que pueden crecer y escalar sin afectar otros componentes. Cada módulo es autosuficiente y exporta su funcionalidad través de **hooks principales**.

---

## 📊 Estructura Completa

```
client/src/
├── App.jsx                              🌟 ORQUESTADOR PRINCIPAL
│   └─ Coordina todos los módulos
│
├── modules/                             📦 MÓDULOS principales
│   │
│   ├── auth/                            🔐 AUTENTICACIÓN
│   │   ├── hooks/
│   │   │   └── useAuth.js               (isAuthenticated, activate(), logout())
│   │   ├── services/
│   │   │   └── authService.js           (checkAuthStatus, activateDevice)
│   │   ├── ui/
│   │   │   └── AccessDenied.jsx         (Pantalla de activación)
│   │   └── context/
│   │       └── AuthContext.jsx          (FUTURO: Context API)
│   │
│   ├── inventory/                       📦 INVENTARIO
│   │   ├── hooks/
│   │   │   └── useInventory.js          (products, categories, handleSell)
│   │   ├── services/
│   │   │   └── inventoryService.js      (CRUD productos/categorías)
│   │   ├── ui/
│   │   │   ├── Header.jsx               (Sticky header + filtrado)
│   │   │   ├── ProductGrid.jsx          (Grid de tarjetas)
│   │   │   ├── ProductCard.jsx          (Tarjeta individual)
│   │   │   └── ErrorBoundary.jsx        (Manejo de errores)
│   │   └── filters/
│   │       └── categoryFilter.js        (Lógica de filtrado)
│   │
│   ├── sales/                           📊 VENTAS
│   │   ├── hooks/
│   │   │   └── useSales.js              (salesHistory, dailyTotal)
│   │   ├── services/
│   │   │   └── salesService.js          (Queries de ventas)
│   │   ├── ui/
│   │   │   ├── SalesDashboard.jsx       (FUTURO)
│   │   │   ├── SalesChart.jsx           (FUTURO)
│   │   │   └── DailyReport.jsx          (FUTURO)
│   │   └── utils/
│   │       └── salesCalculations.js     (FUTURO)
│   │
│   ├── users/                           👥 USUARIOS (FUTURO)
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ui/
│   │
│   └── settings/                        ⚙️ CONFIGURACIÓN (FUTURO)
│       ├── hooks/
│       ├── services/
│       └── ui/
│
├── common/                              🔌 CÓDIGO REUTILIZABLE
│   ├── components/
│   │   ├── LoadingSpinner.jsx           (Spinner)
│   │   ├── Toast.jsx                    (Notificaciones)
│   │   ├── Modal.jsx                    (Modal genérico)
│   │   └── Button.jsx                   (Botón reutilizable)
│   ├── hooks/
│   │   ├── useFetch.js                  (Fetching genérico)
│   │   ├── useLocalStorage.js           (Persistencia)
│   │   └── useDebounce.js               (Debounce)
│   └── utils/
│       ├── constants.js                 (URLs, colores, mensajes)
│       ├── helpers.js                   (Funciones útiles)
│       └── api.js                       (Configuración fetch)
│
├── styles/                              🎨 ESTILOS
│   ├── index.css                        (Importa Tailwind)
│   ├── tailwind.css                     (Directivas Tailwind)
│   ├── variables.css                    (Variables CSS globales)
│   └── animations.css                   (Animaciones personalizadas)
│
└── config/
    ├── env.js                           (Variables de entorno)
    └── api.config.js                    (Configuración API)
```

---

## 🔄 Flujo de Datos

```
App.jsx (Orquestador)
    │
    ├─► useAuth() ──► authService ──► Backend /auth/activate
    │       │
    │       └─► isAuthenticated
    │
    ├─► useInventory(isAuthenticated) ──► inventoryService ──┐
    │       │                                                 │
    │       ├─► fetchProducts                      ──► /products
    │       ├─► fetchCategories                    ──► /categories
    │       └─► handleSell()                       ──► /sell/:id
    │
    └─► useSales(isAuthenticated) ──► salesService ──┐
            │                                         │
            ├─► fetchSalesHistory              ──► /sales/history
            └─► calculateDailyTotal
```

---

## 🎯 Estructura de un Módulo Completo

### Ejemplo: Módulo de Inventario

```
inventory/
├── hooks/
│   └── useInventory.js
│       ├─ Estado: products, categories, selectedCategory
│       ├─ Métodos: handleSell(), refreshInventory()
│       ├─ Efectos: cargar al montar si autenticado
│       └─ Retorna: { products, categories, handleSell, ... }
│
├── services/
│   └── inventoryService.js
│       ├─ fetchProducts()          → GET /api/products
│       ├─ fetchCategories()        → GET /api/categories
│       ├─ sellProduct(id)          → POST /api/sell/id
│       └─ updateProduct(id, data)  → PUT /api/products/id
│
├── ui/
│   ├─ Header.jsx                  (Presentacional, props-based)
│   ├─ ProductGrid.jsx             (Presentacional)
│   ├─ ProductCard.jsx             (Presentacional)
│   └─ ErrorBoundary.jsx           (Manejo de errores)
│
└── filters/
    └── categoryFilter.js           (Lógica de filtrado puro)
```

---

## 📌 Principios Clave

### 1️⃣ Separación de Responsabilidades

```javascript
// ✅ CORRECTO
// services/inventoryService.js - Solo API calls
export async function fetchProducts() { 
  return fetch(...) 
}

// hooks/useInventory.js - Solo lógica de estado
export function useInventory() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    const data = await fetchProducts()
    setProducts(data)
  })
}

// ui/ProductGrid.jsx - Solo renderizar
export default function ProductGrid({ products, onSell }) {
  return <div>{products.map(...)}</div>
}
```

### 2️⃣ Composición de Módulos

```javascript
// App.jsx - Orquestador
function App() {
  const { isAuthenticated } = useAuth()
  const { products } = useInventory(isAuthenticated)
  const { salesHistory } = useSales(isAuthenticated)
  
  // Combinar datos de múltiples módulos
  return <Layout auth={isAuthenticated} products={products} />
}
```

### 3️⃣ Escalabilidad Horizontal

```javascript
// Fase 1: Auth + Inventory
App.jsx
  ├─ useAuth
  └─ useInventory

// Fase 2: Agregar Sales (sin tocar las otras)
App.jsx
  ├─ useAuth         ← Sin cambios
  ├─ useInventory    ← Sin cambios
  └─ useSales        ← NUEVO

// Fase 3: Agregar Users (sin tocar las otras)
App.jsx
  ├─ useAuth         ← Sin cambios
  ├─ useInventory    ← Sin cambios
  ├─ useSales        ← Sin cambios
  └─ useUsers        ← NUEVO
```

---

## 🔗 Flujo de una Venta (End-to-End)

```
1. Usuario hace click en "Vender"

2. ProductCard.jsx
   └─ onClick={onSell(productId)}

3. App.jsx (handleSell)
   └─ useInventory.handleSell(id)

4. useInventory.js
   ├─ FEEDBACK OPTIMISTA: setProducts(stock - 1)
   ├─ inventoryService.sellProduct(id)
   │  └─ POST /api/sell/id
   │
   └─ Si error: 
      ├─ Revertir cambio
      └─ Mostrar error

5. Backend
   ├─ Validar autenticación
   ├─ Decrementar stock (atómica)
   ├─ Agregar a salesHistory
   └─ Retornar éxito

6. useSales.js (automático)
   └─ fetchSalesHistory() recarga datos
```

---

## 📝 Guía: Agregar un Nuevo Módulo

### Ejemplo: Módulo de Reportes

```javascript
// 1. Crear estructura
reports/
├── hooks/
│   └── useReports.js
├── services/
│   └── reportService.js
├── ui/
│   └── ReportsPage.jsx
└── utils/
    └── reportCalculations.js

// 2. Crear hook principal
// reports/hooks/useReports.js
export function useReports(isAuthenticated) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!isAuthenticated) return
    const data = await fetchReports()
    setReports(data)
  }, [isAuthenticated])
  
  return { reports, loading }
}

// 3. Importar en App.jsx
import { useReports } from './modules/reports/hooks/useReports'

// 4. Usarlo en App
function App() {
  const { isAuthenticated } = useAuth()
  const { reports } = useReports(isAuthenticated)
  
  return <ReportsPage reports={reports} />
}
```

---

## 🧪 Testing Structure

```
tests/
├── modules/
│   ├── auth/
│   │   └── useAuth.test.js
│   ├── inventory/
│   │   ├── useInventory.test.js
│   │   └── ProductCard.test.js
│   └── sales/
│       └── useSales.test.js
├── common/
│   └── helpers.test.js
└── integration/
    └── App.integration.test.js
```

---

## 🚀 Checklist para Escalabilidad

- [ ] Cada módulo tiene su propia carpeta
- [ ] Cada módulo exporta un hook principal
- [ ] Las dependencias entre módulos son claras
- [ ] Los servicios no usan estado (funciones puras)
- [ ] Los componentes UI no hacen API calls directos
- [ ] La lógica está separada en 3 capas (hook, service, ui)
- [ ] Hay Errorboundary para manejo de errores
- [ ] Las constantes están centralizadas
- [ ] Hay funciones helper reutilizables

---

## 📖 Referencia Rápida

### Agregar Feature Nuevas

```javascript
// 1. En el módulo
export function useNewFeature() { ... }

// 2. En App.jsx
import { useNewFeature } from './modules/...'
const { data } = useNewFeature(isAuthenticated)

// 3. Renderizar
<ComponenteNuevo data={data} />
```

### Acceder a datos entre módulos

```javascript
// ✅ CORRECTO: A través de App.jsx
function App() {
  const { products } = useInventory()
  const { salesHistory } = useSales()
  
  // Combinar datos aquí
  const enrichedSales = salesHistory.map(sale => ({
    ...sale,
    productName: products.find(p => p._id === sale.productId)?.name
  }))
}

// ❌ INCORRECTO: Directo entre módulos
// useInventory.js
// import { useSales } from '../sales/...' ← NO HACER
```

---

## 🎓 Archivos Clave para Entender

1. **App.jsx** - Entender la orquestación
2. **modules/auth/hooks/useAuth.js** - Patrón de hook
3. **modules/inventory/hooks/useInventory.js** - Patrón complejo con múltiples servicios
4. **modules/inventory/ui/ProductGrid.jsx** - Componente presentacional puro
5. **common/utils/constants.js** - Configuración centralizada

---

**Status**: ✅ Lista para producción  
**Fecha**: 16 de febrero de 2026  
**Versión**: 1.0.0
