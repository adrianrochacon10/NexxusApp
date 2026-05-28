# Prompts para agente frontend

## Prompt 1: ventas con pagos pendientes, parciales y cancelaciones

Actua como especialista senior en frontend Next.js App Router, UX de POS, React, formularios y estados de negocio. Necesito adaptar el frontend de NexxuzApp para soportar ventas con pago completo, pago parcial, adeudo/pendiente y cancelacion, sin mover logica critica al cliente.

Contexto tecnico:

- El backend sera Next.js dentro del mismo proyecto.
- Supabase sera la base definitiva.
- La app usa un modelo compartido por negocio: todos los datos pertenecen a `business_id`.
- Todos los usuarios son `admin`.
- La logica critica debe vivir en Server Actions/casos de uso del backend.
- El frontend NO debe confiar en precios, stock, totales ni saldos calculados en cliente como fuente de verdad.

Necesito que modifiques la UI actual de ventas:

- `src/app/(dashboard)/ventas/nueva/page.tsx`
- `src/app/(dashboard)/ventas/page.tsx`
- componentes nuevos si hacen falta en `src/components/ventas`

Requisitos funcionales:

- En nueva venta, permitir elegir:
  - pago completo,
  - pago parcial,
  - venta pendiente/adeudo.
- Capturar monto recibido cuando aplique.
- Si hay saldo pendiente, mostrar saldo restante.
- Si la venta queda pendiente o parcial, permitir capturar datos simples del cliente/deudor:
  - nombre,
  - telefono opcional,
  - notas opcionales.
- En listado de ventas, mostrar estado de pago:
  - pagada,
  - parcial,
  - pendiente.
- Mostrar estado operativo de venta:
  - activa,
  - cancelada.
- Crear UI para ver detalle de venta.
- Desde detalle, permitir:
  - registrar abono,
  - cancelar venta,
  - capturar motivo de cancelacion.
- Una venta cancelada debe quedar visualmente bloqueada y no debe permitir abonos.

Contrato esperado con backend:

```ts
type RegistrarVentaInput = {
  lineas: Array<{
    productoId: string
    varianteId?: string
    cantidad: number
  }>
  pagoInicial?: {
    monto: number
    formaPago: "efectivo" | "tarjeta" | "transferencia" | "adeudo"
  }
  cliente?: {
    nombre: string
    telefono?: string
  }
  notas?: string
}

type RegistrarAbonoVentaInput = {
  ventaId: string
  monto: number
  formaPago: "efectivo" | "tarjeta" | "transferencia"
  notas?: string
}

type CancelarVentaInput = {
  ventaId: string
  motivo: string
}
```

Server Actions esperadas:

```ts
registrarVentaAction(input: RegistrarVentaInput)
registrarAbonoVentaAction(input: RegistrarAbonoVentaInput)
cancelarVentaAction(input: CancelarVentaInput)
```

Reglas UX:

- El cliente puede calcular vista previa de total y saldo, pero debe mostrar el resultado final devuelto por backend.
- El boton de confirmar venta debe bloquear doble submit.
- Mostrar errores de backend de forma clara.
- No exponer queries directas a Supabase desde componentes cliente.
- No usar `localStorage` para ventas reales.
- Mantener el flujo POS rapido: buscador, ticket, pago, confirmar.

Entregable:

- UI funcional y consistente con el estilo actual.
- Componentes separados para ticket, pagos, estado de venta y detalle.
- No romper el modo demo si aun existe, pero preparar la estructura para Server Actions reales.

## Prompt 2: variantes de producto con mini inventario por talla

Actua como especialista senior en frontend Next.js App Router, UX de inventario y POS. Necesito adaptar el frontend de NexxuzApp para que un producto pueda tener variantes con stock propio. Ejemplo: un mismo modelo de playera tiene talla Chica, Mediana y Grande; cada talla tiene existencia independiente.

Contexto:

- El producto padre representa el modelo general.
- Las variantes representan opciones vendibles con stock propio.
- En el POS, al vender 3 piezas talla Mediana, debe bajar el stock de la variante Mediana, no solo el stock total del producto.
- El backend validara stock, precios y persistencia. El frontend solo prepara la UI y manda IDs/cantidades.

Pantallas a modificar:

- `src/components/inventario/ProductoForm.tsx`
- `src/app/(dashboard)/inventario/page.tsx`
- `src/app/(dashboard)/inventario/[id]/page.tsx`
- `src/app/(dashboard)/ventas/nueva/page.tsx`
- componentes nuevos en `src/components/inventario` y `src/components/ventas`

Modelo esperado en frontend:

```ts
type ProductoConVariantes = {
  id: string
  nombre: string
  sku?: string
  precioVenta: number
  stockTotal: number
  variantes: ProductoVariante[]
}

type ProductoVariante = {
  id: string
  productoId: string
  nombre: string // Ej. "Chica", "Mediana", "Grande"
  sku?: string
  atributos: {
    talla?: string
    color?: string
    [key: string]: string | undefined
  }
  stock: number
  stockMinimo: number
  estatus: "disponible" | "pausado" | "agotado"
}
```

Requisitos de inventario:

- En formulario de producto, agregar seccion "Variantes".
- Permitir crear, editar y eliminar variantes antes de guardar.
- Para playeras, facilitar tallas comunes:
  - Chica,
  - Mediana,
  - Grande,
  - Extra Grande.
- Permitir agregar tallas personalizadas.
- Cada variante debe tener:
  - nombre/talla,
  - SKU opcional,
  - stock,
  - stock minimo.
- El stock total del producto debe mostrarse como suma de variantes.
- Si un producto no tiene variantes, mostrar una variante default tipo "Unica" o mantener compatibilidad visual.

Requisitos POS:

- En busqueda de productos, mostrar productos agrupados.
- Al seleccionar un producto con variantes, pedir elegir talla/variante.
- En ticket, cada linea debe guardar `productoId` y `varianteId`.
- No permitir agregar mas unidades que el stock disponible de esa variante.
- Si una variante esta agotada, bloquear solo esa variante, no todo el producto.

Contrato esperado con backend:

```ts
type CrearProductoInput = {
  nombre: string
  categoriaId: string
  descripcion?: string
  sku?: string
  precioVenta: number
  precioCosto: number
  imagenUrl?: string
  variantes: Array<{
    id?: string
    nombre: string
    sku?: string
    atributos: Record<string, string>
    stock: number
    stockMinimo: number
  }>
}

type VentaLineaInput = {
  productoId: string
  varianteId?: string
  cantidad: number
}
```

Reglas:

- No descontar stock definitivamente en cliente.
- No guardar variantes reales en `localStorage` como fuente final.
- No mandar precio final confiable desde cliente; el backend debe recalcular.
- Mantener UI clara para productos simples y productos con variantes.

Entregable:

- UI de inventario preparada para variantes.
- POS capaz de vender una variante especifica.
- Tipos y componentes ordenados para que backend conecte Server Actions despues.

