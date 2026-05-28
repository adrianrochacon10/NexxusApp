# Mejoras futuras

## FUT-001: mensaje rapido a proveedor por bajo stock

### Objetivo

Cuando un producto o variante este agotado o por debajo de su stock minimo, la app debe poder generar un mensaje sencillo para proveedor y agilizar reposicion de inventario sin buscar producto por producto.

### Estado

Pendiente. No conviene implementarlo todavia como feature productiva porque primero debemos cerrar:

- modelo final de variantes,
- proveedor asignado a producto o variante,
- cantidad sugerida de recompra,
- datos de contacto del proveedor,
- flujo definitivo de compras/reposicion.

### MVP recomendado

Crear una vista "Reposicion" dentro de inventario:

- lista productos y variantes con stock bajo,
- agrupa por proveedor,
- calcula cantidad sugerida:
  - `cantidad_sugerida = max(stock_minimo * 2 - stock_actual, 1)`,
- permite seleccionar productos,
- genera texto copiable para WhatsApp, email o documento.

Ejemplo de mensaje:

```txt
Hola, necesito cotizar/reposicionar estos productos:

- Playera Basica Blanca / Mediana: 6 piezas
- Playera Basica Blanca / Grande: 4 piezas
- Noir Intense 100ml: 3 piezas

Me confirmas disponibilidad, precio y fecha estimada de entrega?
```

### Backend futuro

Tablas sugeridas:

```txt
suppliers
- id
- business_id
- name
- contact_name
- phone
- email
- notes

product_suppliers
- product_id
- variant_id
- supplier_id
- supplier_sku
- last_cost
- preferred

purchase_requests
- id
- business_id
- supplier_id
- status
- generated_message
- created_by
- created_at
```

### Criterio para implementarlo

Implementar despues de que ventas con variantes ya descuenten stock real por variante. Si no, el mensaje puede pedir cantidades incorrectas.

