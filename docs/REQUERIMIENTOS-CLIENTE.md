# Nexxus — Brief de requerimientos (punto de vista del cliente)

> Este documento no describe cómo está construida la app actual (eso ya está en [ANALISIS-PROFUNDO-NEXXUSAPP.md](ANALISIS-PROFUNDO-NEXXUSAPP.md)). Describe **qué necesita el negocio**, redactado como si un cliente estuviera pidiendo el sistema desde cero — para que sirva de especificación funcional al reconstruir la app con una plantilla y mockups nuevos, sin arrastrar decisiones de diseño/arquitectura anteriores.

---

## 1. Quién soy y qué necesito

Tengo un negocio pequeño (retail: ropa, productos con variantes tipo talla/color, etc.) y hoy llevo el inventario, las ventas y las finanzas en hojas de cálculo o cuadernos. Necesito una aplicación web donde mi equipo (todos con el mismo nivel de acceso, "admin") pueda:

1. Controlar qué productos tengo, cuánto stock queda y recibir alertas cuando se acaba.
2. Vender en mostrador (punto de venta) de forma rápida, incluyendo ventas fiadas o con pago parcial.
3. Llevar el control de ingresos y gastos del negocio, y ver reportes simples.
4. Ver de un vistazo cómo va el negocio hoy y este mes (dashboard).

Varias personas de mi equipo van a usar el sistema al mismo tiempo, compartiendo el mismo inventario y caja — no quiero que cada empleado tenga "su propio inventario". Es un solo negocio, varios usuarios.

No necesito manejar múltiples sucursales ni roles distintos (cajero vs. dueño) por ahora — todos los usuarios autorizados tienen el mismo nivel de acceso.

---

## 2. Acceso y cuentas

- Inicio de sesión con correo y contraseña.
- Registro de una cuenta nueva (hoy en día lo tengo roto: existe la lógica pero no la pantalla — quiero que si ofrezco registro, exista la pantalla completa).
- Al registrarse, el usuario debe quedar asociado a un negocio (el suyo propio, o uno al que lo inviten). No me sirve un usuario "suelto" sin negocio.
- Mientras no esté conectado a la base de datos, me gustaría poder abrir la app en modo demo/local para probar el diseño sin necesitar credenciales reales (esto es opcional, "nice to have", no bloqueante).
- Cerrar sesión debe terminar la sesión de verdad, no solo navegar a la pantalla de login.
- Si no he iniciado sesión, no debo poder ver ninguna pantalla interna (inventario, ventas, finanzas, dashboard) — me debe mandar a login automáticamente.

---

## 3. Inventario

### 3.1 Categorías
- Quiero organizar mis productos por categorías (ej. "Playeras", "Pantalones").
- Cada categoría puede definir "atributos base" (ej. Talla, Color, Marca) que luego se usan para mis productos y variantes.
- No debe permitirse crear dos categorías con el mismo nombre para el mismo tipo.
- Quiero poder ver, dentro de una categoría, todos sus productos, el stock total y el valor total del inventario de esa categoría.
- También necesito categorías para clasificar mis gastos e ingresos (categorías de tipo "gasto"/"ingreso", separadas de las de "producto").

### 3.2 Productos
- Cada producto tiene: nombre, SKU (código único por negocio), descripción, categoría, precio de venta, precio de costo, imagen, estatus (disponible / pausado / agotado), y atributos según su categoría.
- El sistema debe poder generar automáticamente un SKU sugerido a partir del nombre de la categoría.
- Quiero ver el margen de ganancia (%) calculado en vivo mientras cargo el precio de venta y de costo.
- Un producto puede tener **variantes** (ej. tallas: Chica/Mediana/Grande) cada una con su propio stock, SKU y stock mínimo. Si el producto tiene variantes, el stock del producto es la suma de sus variantes (no se controla stock a nivel producto).
- No debe poder borrarse el stock por debajo de cero, ni al registrar movimientos ni al vender.
- Al crear o editar un producto debo poder subir una foto (formatos comunes de imagen, límite de tamaño razonable ~4MB).
- Quiero un listado de inventario agrupado por categoría, con alertas visuales cuando un producto está en o por debajo de su stock mínimo, y separado cuando está agotado.
- Necesito poder pausar/reactivar productos sin borrarlos, y poder borrar un producto definitivamente (avisándome que se perderá su historial de movimientos e imagen).

### 3.3 Movimientos de stock
- Toda entrada, salida o ajuste manual de stock debe quedar registrada con fecha, tipo, cantidad, stock antes/después y notas — es mi historial de auditoría de inventario.
- Las ventas también deben generar automáticamente un movimiento de tipo "venta" que descuente stock, y las cancelaciones de venta un registro asociado (ver sección 4).
- Quiero ver el historial de movimientos de cada producto (los más recientes primero).

---

## 4. Ventas / Punto de venta (POS)

### 4.1 Registrar una venta
- Pantalla de venta rápida: buscador de productos (por nombre, SKU o categoría), selección de talla/variante cuando aplique, carrito ("ticket") con cantidades ajustables.
- No debe dejarme vender más unidades de las que hay en stock (ni de producto ni de variante).
- Formas de pago del pago inicial: efectivo, transferencia, tarjeta, o "a crédito"/adeudo (sin pago inicial).
- Modos de cobro:
  - **Completo**: se cobra el 100% al momento.
  - **Parcial**: el cliente abona una parte y queda un saldo pendiente (requiere capturar nombre del cliente, teléfono opcional).
  - **A crédito / adeudo**: no se cobra nada al momento, la venta queda 100% pendiente (también requiere datos del cliente).
- Cada venta debe generar un folio consecutivo por negocio (no reiniciable por usuario).
- Al confirmar la venta: se descuenta el stock correspondiente, se genera un movimiento de inventario, y si hubo pago inicial (distinto de adeudo) se genera automáticamente una transacción de ingreso en finanzas.

### 4.2 Historial de ventas
- Listado de ventas agrupado por fecha (con etiquetas "Hoy"/"Ayer"), mostrando folio, hora, productos vendidos, cliente (si aplica), forma de pago, monto cobrado y saldo pendiente si lo hay.
- KPIs rápidos del día: total cobrado hoy, unidades vendidas hoy, y cuántas cuentas están pendientes de cobro.
- Las ventas canceladas deben distinguirse visualmente (atenuadas) pero seguir apareciendo en el historial.

### 4.3 Cuentas por cobrar (ventas con saldo pendiente)
- Vista dedicada a las ventas no totalmente pagadas, con barra de progreso de cobro, total ya cobrado, total por cobrar, y número de abonos recibidos.
- Debo poder registrar abonos parciales contra el saldo pendiente de una venta, sin poder abonar más del saldo restante.
- Cada abono también debe generar una transacción de ingreso en finanzas.
- Cuando el saldo llega a cero, la venta debe marcarse automáticamente como pagada.

### 4.4 Cancelación de ventas
- Debo poder cancelar una venta indicando un motivo obligatorio.
- Una venta cancelada no debe poder recibir más abonos.
- **Importante — corregir respecto al comportamiento actual**: cuando cancelo una venta, el sistema debe devolver el stock descontado (generando un movimiento de tipo "cancelación") y, si hubo transacciones de ingreso generadas por esa venta, reflejarlo en finanzas. Hoy la cancelación solo marca la venta como cancelada y dice al usuario que hace más, pero no revierte nada — eso es un defecto a corregir en la reconstrucción, no un requerimiento a repetir.

---

## 5. Finanzas

### 5.1 Registro de transacciones
- Debo poder registrar manualmente ingresos, gastos y transferencias, con: fecha, concepto, categoría (de tipo gasto/ingreso, nunca de tipo producto), forma de pago, cantidad, monto, notas y opcionalmente un producto asociado.
- Las transacciones generadas automáticamente por ventas y abonos deben integrarse en el mismo listado que las manuales (no en un lugar aparte).

### 5.2 Listado y balance
- Vista mensual (mes en curso) de ingresos totales, gastos totales y balance neto.
- Listado agrupado por día, con el total neto de cada día, mostrando cada transacción con su categoría (punto de color), concepto, forma de pago y monto (signo según ingreso/gasto).

### 5.3 Reportes
- Reporte del mes en curso con: ganancia neta, ingresos totales, gastos totales.
- Desglose de gastos por categoría (gráfica tipo dona/pie + tabla), con porcentaje de cada categoría sobre el total de gastos.
- Sería valioso (no crítico) tener también una gráfica de evolución de ingresos vs. gastos en el tiempo, no solo del mes actual — la app actual la tiene programada pero nunca la muestra en ninguna pantalla; quiero que si se construye, se use.

---

## 6. Dashboard (pantalla de inicio)

Quiero un panorama del negocio al entrar, sin tener que navegar:

- Alerta destacada si hay productos con stock bajo o agotado, con acceso directo a inventario.
- KPIs: ventas cobradas hoy, ingresos del mes, gastos del mes, balance neto.
- Widget de productos con stock bajo (con acceso directo a cada producto).
- Widget de los 3 productos más vendidos (por unidades).
- Widget de ventas recientes (últimas 3), con acceso directo al detalle y botón para iniciar una venta nueva.
- Widget de últimas transacciones financieras, con acceso directo a finanzas.

---

## 7. Reglas de negocio que deben respetarse siempre

1. Todo dato (productos, categorías, ventas, transacciones, movimientos) pertenece a **un negocio**, no a un usuario individual. Todos los usuarios de ese negocio comparten los mismos datos.
2. El stock nunca puede quedar negativo, ni por venta, ni por ajuste manual, ni por ningún otro movimiento.
3. Un producto con variantes no lleva stock propio: su stock visible es la suma de sus variantes.
4. Toda venta y todo movimiento de stock deben dejar rastro (quién, cuándo, cuánto, antes/después) — no se permite "editar en silencio" el stock.
5. El estado de pago de una venta (pagada/parcial/pendiente) se deriva siempre del monto pagado vs. el total — nunca se marca manualmente.
6. Cancelar una venta debe revertir sus efectos en inventario y finanzas (ver 4.4) — no debe dejar el negocio en un estado inconsistente.
7. No debo poder crear dos productos con el mismo SKU, ni dos categorías con el mismo nombre+tipo, dentro del mismo negocio.

---

## 8. Fuera de alcance (explícitamente, por ahora)

- Múltiples sucursales o bodegas.
- Roles diferenciados (cajero, gerente, dueño) — todos los usuarios del negocio son "admin".
- Facturación fiscal / CFDI.
- Integraciones con pasarelas de pago en línea.
- App móvil nativa (solo web, responsive).

---

## 9. Qué no se hereda del proyecto anterior

Esta reconstrucción parte de una plantilla nueva y mockups propios distintos a los actuales. No es un requerimiento del negocio, sino una decisión de este ciclo de trabajo:

- No se reutiliza el sistema visual/diseño actual (paleta oscura, tipografías, componentes de UI).
- No se reutiliza necesariamente el mismo stack técnico exacto si la plantilla elegida trae otro (aunque Next.js + Supabase + TypeScript cubre bien los requerimientos de arriba).
- Sí se debe conservar el modelo de negocio compartido multi-usuario (sección 1 y regla 1), porque es un requerimiento real del cliente, no un detalle de implementación.
