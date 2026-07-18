# Zona iOS — Sistema de Gestión Comercial | Spec MVP v1.0

> Proyecto independiente de Tithelio. Cliente: **Zona iOS** — cadena de tiendas de dispositivos Apple/accesorios, sede principal Medellín + sucursales en Tolima y otras zonas de Colombia. Logo: [`public/logo-zona-ios.png`](./public/logo-zona-ios.png).

---

## 1. Resumen y objetivo

Reemplazar la operación manual actual (Excel para inventario, Word para facturas, control de caja en papel) por una plataforma web centralizada que administre inventario, ventas (POS), apartados, pagos en especie, caja, facturación interna, cartera, prospectos y postventa para una cadena multi-sucursal.

**Fuera de alcance de este MVP** (ver sección 9): facturación electrónica DIAN real, operación offline/hardware local por sucursal, campañas automatizadas por WhatsApp. Estas quedan como Fase 2 y no deben condicionar el diseño del MVP, pero el modelo de datos debe dejar espacio para incorporarlas sin romper lo construido (ver notas de extensibilidad en cada módulo).

---

## 2. Contexto de negocio

- Sede principal: Medellín. 5 sucursales adicionales en Tolima y otras zonas.
- Catálogo: dispositivos Apple (nuevos, usados, reacondicionados, en exhibición), forros, cargadores, audífonos y accesorios.
- Volumen actual: bajo (aprox. 5 facturas cada 1-2 semanas a nivel consolidado) — el sistema debe ser simple de operar, no sobre-diseñado para un volumen que no existe todavía.
- Modalidades de venta propias del negocio que el sistema debe soportar:
  - Venta directa de contado/tarjeta/transferencia.
  - **Apartado**: cliente abona una parte del valor, el producto queda reservado y no se factura hasta saldar.
  - **Pago en especie**: cliente entrega un dispositivo usado como parte del pago; ese dispositivo se valora (peritaje) y entra al inventario como usado.
- Factura actual: manual en Word, numeración consecutiva a mano, se envía por correo a la contadora. El MVP **automatiza este mismo flujo** (no reemplaza el proceso de negocio, solo lo digitaliza): numeración por sucursal, generación en PDF, envío automático por correo a la contadora. No es factura electrónica DIAN.

---

## 3. Stack tecnológico

Proyecto nuevo y aislado (no comparte base de datos ni repo con Tithelio, aunque reutiliza patrones ya probados de ese codebase).

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | **Supabase Postgres** (usado solo como Postgres administrado + Storage; no se usa Supabase Auth ni RLS) |
| ORM | Prisma |
| Auth | NextAuth.js (mismo patrón que Tithelio: credentials + roles), **no Supabase Auth** — evita reconstruir el modelo de permisos ya probado |
| Storage de archivos | Supabase Storage (fotos de producto, PDFs de factura/acta de entrega) |
| PDF | @react-pdf/renderer |
| Email | Nodemailer (SMTP) — mismo patrón que Tithelio |
| QR | Librería cliente (ej. `qrcode`) para generar el QR de captura de leads; sin dependencias externas de pago |
| Hosting | Vercel |

**Nota de extensibilidad**: la capa de facturación se diseña con una interfaz `IInvoiceIssuer` desacoplada del dominio (mismo patrón que `IDianTransport` en Tithelio), de modo que en Fase 2 se pueda conectar un Proveedor Tecnológico DIAN real sin rediseñar el modelo de `Invoice`.

---

## 4. Roles y permisos

| Rol | Alcance | Permisos clave |
|---|---|---|
| **Administrador General** | Todas las sucursales | Crear/editar sucursales, crear usuarios, ver KPIs consolidados, ver todas las cajas, autorizar anulaciones, configurar sistema |
| **Operador (vendedor/cajero)** | Solo su(s) sucursal(es) asignada(s) | Registrar ventas, apartados, abonos, pagos en especie, garantías; abrir/cerrar caja; consultar inventario de su sucursal; no ve otras sucursales, no configura sistema, no anula ventas |

Todo movimiento (venta, abono, apertura/cierre de caja, cambio de inventario) queda asociado al usuario que lo ejecutó (auditoría básica por `userId` + `timestamp`, sin necesidad de un módulo de auditoría separado en el MVP).

---

## 5. Modelo de datos

> El modelo de datos vive únicamente en [`prisma/schema.prisma`](./prisma/schema.prisma) — es la fuente de verdad (probado: `prisma generate`, `tsc --noEmit` y `next build` corren limpios contra ese archivo). Este documento ya no incluye una copia del schema para no arriesgar que las dos versiones diverjan; cualquier cambio de modelo se hace ahí directamente.

Resumen de entidades (ver el archivo para campos, enums e índices completos):

| Entidad | Rol |
|---|---|
| `Sucursal`, `Usuario` | Administración y roles (`ADMIN_GENERAL` / `OPERADOR`) |
| `Product`, `InventoryMovement` | Catálogo con IMEI/serial por sucursal y su historial de movimientos |
| `Cliente`, `Prospecto` | Clientes existentes vs. leads capturados por QR |
| `Sale`, `SaleItem` | Ventas de POS y sus líneas |
| `Apartado`, `Abono`, `CarteraSeguimiento` | Separado con abonos parciales + bitácora de cobranza |
| `TradeIn` | Pago en especie (equipo usado recibido como parte de pago) |
| `Invoice` | Factura interna con numeración consecutiva por sucursal |
| `CashRegisterSession`, `CashMovement` | Caja (apertura/cierre) y caja menor, unificadas |
| `Warranty` | Postventa/garantías |

---

## 6. Módulos

### 6.1 Administración
- CRUD de sucursales (solo Admin General).
- CRUD de usuarios/operadores, asignación a sucursal.
- Activar/inactivar sucursales y usuarios.

### 6.2 Dashboard / KPIs por sucursal
- Admin General: ventas del día/mes por sucursal, comparativo, caja actual por sucursal, apartados activos, valor total en cartera pendiente, productos con stock bajo.
- Operador: solo ve los KPIs de su propia sucursal.

### 6.3 Inventario
- Catálogo con IMEI/serial para dispositivos, atributos (categoría, marca, modelo, color, capacidad, condición).
- Stock por sucursal (un `Product` pertenece a una sucursal; traslado = mover el registro y dejar `InventoryMovement` tipo `TRASLADO`).
- Movimientos: entrada (recepción de mercancía), salida (venta), ajuste.
- Sin conteo físico/kardex valorizado en el MVP (se puede diferir a Fase 2 si se requiere).

### 6.4 QR + Captura de prospectos
- QR fijo por sucursal (o general) que enlaza a un formulario público simple (nombre, teléfono, correo, producto de interés, presupuesto).
- Guarda en `Prospecto`. Sin envío de campañas en este MVP — solo captura y listado/exportación para que el vendedor haga seguimiento manual.

### 6.5 POS (Ventas)
- Buscar producto por IMEI/SKU/nombre.
- Carrito, forma de pago (efectivo/transferencia/tarjeta/mixto).
- Al confirmar: descuenta inventario, genera `Sale`, genera `Invoice` (numeración interna por sucursal + PDF), registra `CashMovement` tipo `INGRESO_VENTA` en la sesión de caja abierta.
- Si la venta incluye pago en especie, abre el flujo de `TradeIn` (ver 6.7) en el mismo momento del checkout.

### 6.6 Apartados y Cartera
- Crear apartado: cliente, producto (se reserva y sale de disponible para otros clientes), valor total, abono inicial, fecha límite opcional.
- Registrar abonos sucesivos: cada uno genera un recibo de caja (PDF) y un `CashMovement` tipo `INGRESO_ABONO`.
- Al llegar `saldoPendiente` a 0: genera `Invoice`, marca `Apartado.status = SALDADO`, libera el producto para entrega.
- **Cartera**: vista de todos los apartados con `saldoPendiente > 0`, agrupados por antigüedad (calculada desde el último abono o desde `fechaLimite`), con bitácora de seguimiento (`CarteraSeguimiento`) por cliente. Solo uso interno — sin notificaciones automáticas al cliente en este MVP.

### 6.7 Pago en especie (Trade-in)
- Al recibir un dispositivo usado como parte de pago: registrar IMEI, modelo, condición, batería, observaciones y valor reconocido (peritaje manual del operador).
- Al confirmar, crea un `Product` nuevo con `condicion = USADO` en el inventario de la sucursal y lo vincula a `TradeIn.productoResultanteId`.
- El valor reconocido se descuenta del total a pagar por el cliente en esa venta.

### 6.8 Caja
- Apertura de sesión de caja: saldo inicial, usuario, sucursal.
- Durante el turno: todos los ingresos (ventas, abonos, caja menor) y egresos (caja menor) quedan como `CashMovement` de esa sesión.
- Cierre: el sistema calcula el saldo esperado, el operador ingresa el conteo real, se registra la diferencia. Reutiliza el patrón de arqueo ya probado en Tithelio (discrepancia, resolución, idempotencia de cierre).

### 6.9 Caja menor
- Ingresos y egresos menores (arriendo, papelería, transporte) dentro de la misma sesión de caja o como fondo aparte, según se defina con el cliente — recomendado: mismo `CashRegisterSession`/`CashMovement` para no duplicar el concepto de "caja" en dos módulos distintos.

### 6.10 Facturación interna
- Al generar una venta o saldar un apartado: crear `Invoice` con numeración consecutiva **por sucursal** (`@@unique([sucursalId, numero])`), generar PDF (@react-pdf/renderer) y enviarlo automáticamente por correo a la contadora (dirección configurable por el Admin General).
- No es factura electrónica DIAN — es la digitalización 1:1 del proceso actual en Word.

### 6.11 Entrega del producto
- Al saldar un apartado o completar una venta de contado: generar acta de entrega en PDF (cliente, producto, fecha, responsable) — reutiliza el mismo motor de PDF que la factura.

### 6.12 Postventa / Garantías
- Registrar solicitud de garantía: producto, cliente, motivo, diagnóstico.
- Estados: recibido → en revisión → en reparación / enviado a proveedor → aprobado/rechazado → entregado.
- Historial simple asociado al producto (vía `productId`).

---

## 7. Flujos principales

**Venta directa**: buscar producto → cobrar → generar factura interna → descontar inventario → registrar ingreso en caja.

**Apartado**: reservar producto → abono inicial → (abonos sucesivos con recibo) → saldo en 0 → factura → entrega.

**Pago en especie**: cliente compra equipo → entrega equipo usado → peritaje → valor reconocido se resta del total → equipo usado entra a inventario → resto se paga por otro medio.

**Cierre de caja**: apertura con saldo inicial → movimientos del turno (ventas, abonos, caja menor) → cierre con conteo físico → diferencia registrada.

**Seguimiento de cartera**: reporte de apartados con saldo pendiente → antigüedad → nota de seguimiento → próxima acción — todo interno, sin notificación automática al cliente.

---

## 8. Roles vs módulos (resumen de permisos)

| Módulo | Admin General | Operador |
|---|---|---|
| Sucursales/usuarios | CRUD | — |
| Dashboard | Todas las sucursales | Solo la propia |
| Inventario | Ver/editar todas | Ver/editar solo su sucursal |
| POS | Sí | Sí (solo su sucursal) |
| Apartados/Cartera | Ver todas | Ver/gestionar solo su sucursal |
| Caja | Ver todas, autorizar ajustes | Abrir/cerrar la propia |
| Facturación | Configurar correo contadora | Generar (automático desde venta) |
| Garantías | Ver todas | Registrar/gestionar su sucursal |

---

## 9. Fuera de alcance del MVP (Fase 2 / Fase 3)

- **Facturación electrónica DIAN real** — hoy queda como factura interna con numeración propia; migrar a DIAN requiere elegir un Proveedor Tecnológico autorizado y pasar por habilitación (Concepto DIAN 13246/2025). El modelo `Invoice` y la interfaz `IInvoiceIssuer` quedan preparados para ese cambio sin rediseño.
- **Operación offline / hardware local por sucursal** (mini-PC, sync local-first) — solo si se confirma que el fallback de conectividad (4G/LTE dual-WAN) no es suficiente en las sucursales con problemas de internet.
- **Campañas automatizadas a prospectos/cartera vía WhatsApp** — requiere WhatsApp Business API (Meta/360dialog/Twilio), fuera del MVP por decisión explícita del cliente.
- **Conteo físico de inventario / kardex valorizado (PPP)** — diferido; el MVP resuelve stock y movimientos, no costeo contable de inventario.

---

## 10. Estimación de desarrollo (referencia interna)

| Módulo | Semanas |
|---|---|
| Sucursales + roles | 1-2 |
| Dashboard KPIs | 1-2 |
| Inventario | 2-3 |
| QR + prospectos | 0.5-1 |
| POS | 2-3 |
| Apartados | 1.5-2 |
| Pago en especie | 1-2 |
| Cartera (seguimiento interno) | 1.5-2 |
| Caja / caja menor | 1-2 |
| Facturación interna + PDF + correo | 1 |
| Postventa/garantías | 1.5-2 |
| QA + migración desde Excel + capacitación | 1.5-2 |
| **Total** | **~17-24 semanas (≈ 4-6 meses, 1 dev)** |

> Nota: esta tabla es para planeación interna, no para compartir tal cual con el cliente sin revisar cifras de precio.

---

## 11. Preguntas abiertas (resolver antes de programar el módulo correspondiente)

| # | Pregunta | Módulo afectado | Por qué importa |
|---|---|---|---|
| 1 | Si un apartado se cancela, ¿se devuelve el abono al cliente o queda como saldo a favor para otra compra? | Apartados (6.6) | Define si `ApartadoStatus.CANCELADO` dispara un `CashMovement` de egreso o no — sin esto no se puede programar la cancelación. |
| 2 | Cuando hay pago en especie, ¿`Sale.total` es el valor bruto del producto o ya neto del valor reconocido del trade-in? | POS (6.5) / Pago en especie (6.7) | Afecta el cálculo del recibo, lo que se factura y lo que se registra en caja — hay que fijarlo antes de tocar el checkout. |
| 3 | Al anular una factura, ¿el número consecutivo se reutiliza o queda con un hueco? | Facturación interna (6.10) | Cambia la validación de `@@unique([sucursalId, numero])` y cómo se calcula el siguiente número. |
| 4 | Cuando un prospecto captado por QR termina comprando, ¿se convierte automáticamente en `Cliente` o quedan como registros separados sin relación? | QR/Prospectos (6.4) | Si se promueve automático, hace falta una regla de "match" (por teléfono/correo) antes de programar el checkout. |
| 5 | ¿Cuál es el formato exacto del Excel que usan hoy para inventario/ventas? | Migración de datos (estimación, sección 10) | Se necesita para diseñar el importador — pedir el archivo real al cliente antes de esa fase. |

Recomendación: resolver la pregunta correspondiente justo antes de empezar cada módulo (no hace falta cerrarlas todas de una vez), salvo la 5 que conviene pedir cuanto antes porque depende del cliente y no de una decisión interna.
