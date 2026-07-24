import * as dotenv from "dotenv";
dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

import bcrypt from "bcrypt";
import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL no está configurada — revisa tu archivo .env");
  }

  const passwordHash = await bcrypt.hash("changeme123", 10);

  // ── Limpiar datos existentes (en orden inverso de dependencias) ──
  await prisma.cashMovement.deleteMany();
  await prisma.cashRegisterSession.deleteMany();
  await prisma.carteraSeguimiento.deleteMany();
  await prisma.abono.deleteMany();
  await prisma.apartado.deleteMany();
  await prisma.tradeIn.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.prospecto.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.sucursal.deleteMany();

  // ── Sucursales ──
  const med = await prisma.sucursal.create({
    data: { id: "suc-med", nombre: "Medellín (Principal)", ciudad: "Medellín", direccion: "Calle 10 #42-25, El Poblado" },
  });
  const bog = await prisma.sucursal.create({
    data: { id: "suc-bog", nombre: "Bogotá (Centro)", ciudad: "Bogotá", direccion: "Carrera 7 #45-12, Chapinero" },
  });
  const cali = await prisma.sucursal.create({
    data: { id: "suc-cali", nombre: "Cali (Granada)", ciudad: "Cali", direccion: "Av 6N #23-08, Granada" },
  });

  // ── Usuarios ──
  const admin = await prisma.usuario.create({
    data: { id: "user-admin", nombre: "Administrador General", email: "admin@tienda.com", passwordHash, rol: "ADMIN_GENERAL", sucursalId: med.id },
  });
  const opMed = await prisma.usuario.create({
    data: { id: "user-op-med", nombre: "Carlos López", email: "operador1@tienda.com", passwordHash, rol: "OPERADOR", sucursalId: med.id },
  });
  const opBog = await prisma.usuario.create({
    data: { id: "user-op-bog", nombre: "María García", email: "operador2@tienda.com", passwordHash, rol: "OPERADOR", sucursalId: bog.id },
  });

  // ── Productos ──
  function sku(prefix: string) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${rand}`;
  }

  const iP16PM = await prisma.product.create({
    data: { id: "prod-1", sku: sku("IPM"), nombre: "iPhone 16 Pro Max", categoria: "IPHONE", marca: "Apple", modelo: "A3296", color: "Natural Titanium", capacidad: "256GB", condicion: "NUEVO", costo: 1100, precioVenta: 1499.99, tieneGarantia: true, mesesGarantia: 12, sucursalId: med.id },
  });
  const iP16P = await prisma.product.create({
    data: { id: "prod-2", sku: sku("IPM"), nombre: "iPhone 16 Pro", categoria: "IPHONE", marca: "Apple", modelo: "A3294", color: "White", capacidad: "128GB", condicion: "NUEVO", costo: 950, precioVenta: 1299.99, tieneGarantia: true, mesesGarantia: 12, sucursalId: med.id },
  });
  const iP15PM = await prisma.product.create({
    data: { id: "prod-3", sku: sku("IPM"), nombre: "iPhone 15 Pro Max", categoria: "IPHONE", marca: "Apple", modelo: "A2849", color: "Black", capacidad: "512GB", imei: "351234567891234", condicion: "USADO", costo: 800, precioVenta: 1099.99, sucursalId: med.id },
  });
  const iP14 = await prisma.product.create({
    data: { id: "prod-4", sku: sku("IPM"), nombre: "iPhone 14", categoria: "IPHONE", marca: "Apple", modelo: "A2882", color: "Midnight", capacidad: "128GB", imei: "351234567891235", condicion: "USADO", costo: 500, precioVenta: 699.99, sucursalId: med.id },
  });
  const iPadPro = await prisma.product.create({
    data: { id: "prod-5", sku: sku("IPA"), nombre: "iPad Pro M4 11\"", categoria: "IPAD", marca: "Apple", color: "Silver", capacidad: "256GB", condicion: "NUEVO", costo: 900, precioVenta: 1199.99, tieneGarantia: true, mesesGarantia: 12, sucursalId: med.id },
  });
  const iPadAir = await prisma.product.create({
    data: { id: "prod-6", sku: sku("IPA"), nombre: "iPad Air M2 13\"", categoria: "IPAD", marca: "Apple", color: "Space Gray", capacidad: "128GB", condicion: "NUEVO", costo: 650, precioVenta: 899.99, sucursalId: bog.id },
  });
  const watchUltra = await prisma.product.create({
    data: { id: "prod-7", sku: sku("IPW"), nombre: "Apple Watch Ultra 2", categoria: "APPLE_WATCH", marca: "Apple", color: "Natural", capacidad: "64GB", condicion: "NUEVO", costo: 650, precioVenta: 849.99, tieneGarantia: true, mesesGarantia: 12, sucursalId: bog.id },
  });
  const watchS9 = await prisma.product.create({
    data: { id: "prod-8", sku: sku("IPW"), nombre: "Apple Watch Series 9", categoria: "APPLE_WATCH", marca: "Apple", color: "Midnight", capacidad: "45mm", condicion: "NUEVO", costo: 350, precioVenta: 499.99, sucursalId: bog.id },
  });
  const airPodsPro = await prisma.product.create({
    data: { id: "prod-9", sku: sku("IPA"), nombre: "AirPods Pro 2 USB-C", categoria: "AIRPODS", marca: "Apple", condicion: "NUEVO", costo: 180, precioVenta: 279.99, tieneGarantia: true, mesesGarantia: 6, sucursalId: med.id },
  });
  const airPodsMax = await prisma.product.create({
    data: { id: "prod-10", sku: sku("IPA"), nombre: "AirPods Max", categoria: "AIRPODS", marca: "Apple", color: "Space Gray", condicion: "USADO", costo: 350, precioVenta: 499.99, sucursalId: cali.id },
  });
  const forro = await prisma.product.create({
    data: { id: "prod-11", sku: sku("IPA"), nombre: "Forro Silicona iPhone 16 Pro Max", categoria: "FORRO", marca: "Spigen", color: "Black", condicion: "NUEVO", costo: 15, precioVenta: 34.99, sucursalId: cali.id },
  });
  const cargador = await prisma.product.create({
    data: { id: "prod-12", sku: sku("IPA"), nombre: "Cargador USB-C 20W", categoria: "CARGADOR", marca: "Apple", condicion: "NUEVO", costo: 12, precioVenta: 29.99, sucursalId: cali.id },
  });
  const vidrio = await prisma.product.create({
    data: { id: "prod-13", sku: sku("IPA"), nombre: "Vidrio Templado iPhone 16 Pro Max", categoria: "VIDRIO", marca: "Belkin", condicion: "NUEVO", costo: 8, precioVenta: 19.99, sucursalId: med.id },
  });
  const iP16Med = await prisma.product.create({
    data: { id: "prod-14", sku: sku("IPM"), nombre: "iPhone 16 Pro 256GB", categoria: "IPHONE", marca: "Apple", modelo: "A3294", color: "Desert Titanium", capacidad: "256GB", condicion: "NUEVO", costo: 1050, precioVenta: 1399.99, tieneGarantia: true, mesesGarantia: 12, sucursalId: med.id },
  });
  const iP15Bog = await prisma.product.create({
    data: { id: "prod-15", sku: sku("IPM"), nombre: "iPhone 15 128GB", categoria: "IPHONE", marca: "Apple", modelo: "A3090", color: "Blue", capacidad: "128GB", imei: "351234567891236", condicion: "USADO", costo: 450, precioVenta: 649.99, sucursalId: bog.id },
  });
  const iP14Cali = await prisma.product.create({
    data: { id: "prod-16", sku: sku("IPM"), nombre: "iPhone 14 Plus", categoria: "IPHONE", marca: "Apple", modelo: "A2886", color: "Purple", capacidad: "256GB", imei: "351234567891237", condicion: "REACONDICIONADO", costo: 550, precioVenta: 749.99, sucursalId: cali.id },
  });
  const iPSE = await prisma.product.create({
    data: { id: "prod-17", sku: sku("IPM"), nombre: "iPhone SE 3 64GB", categoria: "IPHONE", marca: "Apple", modelo: "A2783", color: "Red", capacidad: "64GB", imei: "351234567891238", condicion: "REACONDICIONADO", costo: 250, precioVenta: 399.99, sucursalId: cali.id },
  });
  const iPad10 = await prisma.product.create({
    data: { id: "prod-18", sku: sku("IPA"), nombre: "iPad 10ª gen 64GB", categoria: "IPAD", marca: "Apple", color: "Yellow", capacidad: "64GB", condicion: "USADO", costo: 300, precioVenta: 449.99, sucursalId: med.id },
  });

  // ── Movimientos de inventario (entradas iniciales) ──
  for (const prod of [iP16PM, iP16P, iP15PM, iP14, iPadPro, iPadAir, watchUltra, watchS9, airPodsPro, airPodsMax, forro, cargador, vidrio, iP16Med, iP15Bog, iP14Cali, iPSE, iPad10]) {
    await prisma.inventoryMovement.create({
      data: { productId: prod.id, tipo: "ENTRADA", cantidad: 5, motivo: "Inventario inicial", userId: admin.id },
    });
  }

  // ── Clientes ──
  const c1 = await prisma.cliente.create({ data: { id: "cli-1", nombre: "Juan Pérez", telefono: "3001234567", correo: "juan@email.com", ciudad: "Medellín" } });
  const c2 = await prisma.cliente.create({ data: { id: "cli-2", nombre: "Ana Martínez", telefono: "3107654321", correo: "ana@email.com", ciudad: "Bogotá" } });
  const c3 = await prisma.cliente.create({ data: { id: "cli-3", nombre: "Pedro Ramírez", telefono: "3159876543", ciudad: "Cali" } });
  const c4 = await prisma.cliente.create({ data: { id: "cli-4", nombre: "Laura Gómez", telefono: "3205556677", correo: "laura@email.com", ciudad: "Medellín" } });
  const c5 = await prisma.cliente.create({ data: { id: "cli-5", nombre: "Carlos Ruiz", telefono: "3223334455", ciudad: "Bogotá" } });

  // ── Prospectos ──
  await prisma.prospecto.createMany({
    data: [
      { nombre: "Andrés Torres", telefono: "3011112233", correo: "andres@email.com", productoInteres: "iPhone 16 Pro Max", presupuesto: 1500, sucursalId: med.id },
      { nombre: "Diana López", telefono: "3112223344", productoInteres: "iPad Air M2", presupuesto: 900, sucursalId: med.id },
      { nombre: "Roberto Sánchez", telefono: "3163334455", correo: "roberto@email.com", productoInteres: "Apple Watch Ultra 2", sucursalId: bog.id },
      { nombre: "Carmen Vega", telefono: "3214445566", productoInteres: "iPhone 15 Pro Max", presupuesto: 1100, sucursalId: bog.id },
      { nombre: "Felipe Navarro", telefono: "3175556677", productoInteres: "AirPods Pro 2", sucursalId: cali.id },
    ],
  });

  // ── Ventas ──
  const sale1 = await prisma.sale.create({
    data: { id: "sale-1", sucursalId: med.id, clienteId: c1.id, userId: opMed.id, total: 1779.98, metodoPago: "EFECTIVO",
      items: { create: [{ productId: iP16P.id, cantidad: 1, precioUnit: 1299.99 }, { productId: forro.id, cantidad: 1, precioUnit: 34.99 }, { productId: vidrio.id, cantidad: 1, precioUnit: 19.99 }] },
    },
  });
  const sale2 = await prisma.sale.create({
    data: { id: "sale-2", sucursalId: med.id, clienteId: c4.id, userId: opMed.id, total: 1499.99, metodoPago: "TARJETA",
      items: { create: [{ productId: iP16PM.id, cantidad: 1, precioUnit: 1499.99 }] },
    },
  });
  const sale3 = await prisma.sale.create({
    data: { id: "sale-3", sucursalId: bog.id, clienteId: c2.id, userId: opBog.id, total: 2699.97, metodoPago: "TRANSFERENCIA",
      items: { create: [{ productId: iPadAir.id, cantidad: 1, precioUnit: 899.99 }, { productId: watchUltra.id, cantidad: 1, precioUnit: 849.99 }, { productId: airPodsPro.id, cantidad: 1, precioUnit: 279.99 }] },
    },
  });
  const sale4 = await prisma.sale.create({
    data: { id: "sale-4", sucursalId: cali.id, clienteId: c3.id, userId: admin.id, total: 524.98, metodoPago: "MIXTO",
      items: { create: [{ productId: cargador.id, cantidad: 1, precioUnit: 29.99 }, { productId: airPodsMax.id, cantidad: 1, precioUnit: 499.99 }] },
    },
  });

  // ── Facturas ──
  // Necesitamos números por sucursal
  let numMed = 1000, numBog = 1000, numCali = 1000;
  await prisma.invoice.create({
    data: { sucursalId: med.id, saleId: sale1.id, numero: numMed++, pdfUrl: "", status: "EMITIDA", createdAt: new Date("2026-07-10") },
  });
  await prisma.invoice.create({
    data: { sucursalId: med.id, saleId: sale2.id, numero: numMed++, pdfUrl: "", status: "EMITIDA", createdAt: new Date("2026-07-12") },
  });
  await prisma.invoice.create({
    data: { sucursalId: bog.id, saleId: sale3.id, numero: numBog++, pdfUrl: "", status: "EMITIDA", createdAt: new Date("2026-07-11") },
  });
  await prisma.invoice.create({
    data: { sucursalId: cali.id, saleId: sale4.id, numero: numCali++, pdfUrl: "", status: "EMITIDA", createdAt: new Date("2026-07-13") },
  });

  // ── Movimientos de inventario por ventas ──
  const allItems = await prisma.saleItem.findMany({ include: { product: true } });
  for (const item of allItems) {
    await prisma.inventoryMovement.create({
      data: { productId: item.productId, tipo: "SALIDA", cantidad: item.cantidad, motivo: `Venta #${item.saleId}`, referenceType: "VENTA", referenceId: item.saleId, userId: admin.id },
    });
  }

  // ── Caja (Medellín) ──
  const sesAbierta = await prisma.cashRegisterSession.create({
    data: { id: "caja-med-actual", sucursalId: med.id, userId: opMed.id, saldoInicial: 500000, abiertaEn: new Date("2026-07-18T08:00:00") },
  });
  // Caja anterior cerrada
  const sesCerrada = await prisma.cashRegisterSession.create({
    data: { id: "caja-med-cerrada", sucursalId: med.id, userId: opMed.id, saldoInicial: 300000, saldoFinalEsperado: 1050000, saldoFinalContado: 1050000, diferencia: 0, abiertaEn: new Date("2026-07-17T08:00:00"), cerradaEn: new Date("2026-07-17T19:00:00") },
  });
  await prisma.cashMovement.createMany({
    data: [
      { sessionId: sesCerrada.id, tipo: "INGRESO_VENTA", monto: 1299.99, concepto: "Venta iPhone 16 Pro", referenceId: sale1.id },
      { sessionId: sesCerrada.id, tipo: "INGRESO_VENTA", monto: 1499.99, concepto: "Venta iPhone 16 Pro Max", referenceId: sale2.id },
      { sessionId: sesCerrada.id, tipo: "EGRESO_CAJA_MENOR", monto: 50000, concepto: "Compra café y agua para oficina" },
      { sessionId: sesCerrada.id, tipo: "EGRESO_CAJA_MENOR", monto: 35000, concepto: "Taxi envío equipo a cliente" },
      { sessionId: sesAbierta.id, tipo: "INGRESO_VENTA", monto: 1299.99, concepto: "Venta del día (parcial)" },
    ],
  });

  // ── Caja Bogotá ──
  const sesBog = await prisma.cashRegisterSession.create({
    data: { id: "caja-bog-actual", sucursalId: bog.id, userId: opBog.id, saldoInicial: 400000, abiertaEn: new Date("2026-07-18T08:30:00") },
  });
  await prisma.cashMovement.createMany({
    data: [
      { sessionId: sesBog.id, tipo: "INGRESO_VENTA", monto: 2699.97, concepto: "Venta iPad Air + Watch Ultra + AirPods", referenceId: sale3.id },
      { sessionId: sesBog.id, tipo: "EGRESO_CAJA_MENOR", monto: 25000, concepto: "Domicilio" },
    ],
  });

  // ── Apartados ──
  const ap1 = await prisma.apartado.create({
    data: { id: "ap-1", sucursalId: med.id, clienteId: c4.id, productId: iP15PM.id, valorTotal: 1099.99, saldoPendiente: 700, fechaLimite: new Date("2026-08-15"), status: "ACTIVO", userId: opMed.id, createdAt: new Date("2026-06-20") },
  });
  const ap2 = await prisma.apartado.create({
    data: { id: "ap-2", sucursalId: med.id, clienteId: c1.id, productId: iPadPro.id, valorTotal: 1199.99, saldoPendiente: 0, status: "SALDADO", userId: opMed.id, createdAt: new Date("2026-06-01") },
  });
  const ap3 = await prisma.apartado.create({
    data: { id: "ap-3", sucursalId: bog.id, clienteId: c5.id, productId: watchS9.id, valorTotal: 499.99, saldoPendiente: 300, fechaLimite: new Date("2026-08-01"), status: "ACTIVO", userId: opBog.id, createdAt: new Date("2026-07-01") },
  });
  const ap4 = await prisma.apartado.create({
    data: { id: "ap-4", sucursalId: cali.id, clienteId: c3.id, productId: iP14Cali.id, valorTotal: 749.99, saldoPendiente: 749.99, fechaLimite: new Date("2026-09-01"), status: "ACTIVO", userId: admin.id, createdAt: new Date("2026-07-15") },
  });

  // ── Abonos ──
  await prisma.abono.createMany({
    data: [
      { apartadoId: ap1.id, monto: 399.99, metodoPago: "EFECTIVO", userId: opMed.id, createdAt: new Date("2026-06-20") },
      { apartadoId: ap2.id, monto: 600, metodoPago: "EFECTIVO", userId: opMed.id, createdAt: new Date("2026-06-01") },
      { apartadoId: ap2.id, monto: 599.99, metodoPago: "TRANSFERENCIA", userId: opMed.id, createdAt: new Date("2026-06-10") },
      { apartadoId: ap3.id, monto: 199.99, metodoPago: "TARJETA", userId: opBog.id, createdAt: new Date("2026-07-01") },
    ],
  });

  // ── Seguimientos cartera ──
  await prisma.carteraSeguimiento.createMany({
    data: [
      { apartadoId: ap1.id, nota: "Cliente llamó diciendo que paga la próxima semana", proximaAccion: new Date("2026-07-25"), userId: opMed.id, createdAt: new Date("2026-07-15") },
      { apartadoId: ap3.id, nota: "Se le recordó vencimiento por WhatsApp", proximaAccion: new Date("2026-07-20"), userId: opBog.id, createdAt: new Date("2026-07-14") },
    ],
  });

  // ── Garantías ──
  await prisma.warranty.create({
    data: { id: "war-1", productId: iP15PM.id, clienteId: c1.id, motivo: "Batería no dura más de 2 horas", diagnostico: "Batería degradada al 78%", status: "EN_REVISION", userId: opMed.id, createdAt: new Date("2026-07-08"), updatedAt: new Date("2026-07-09") },
  });
  await prisma.warranty.create({
    data: { id: "war-2", productId: airPodsMax.id, clienteId: c3.id, motivo: "Auricular izquierdo no suena", status: "RECIBIDO", userId: opBog.id, createdAt: new Date("2026-07-15"), updatedAt: new Date("2026-07-15") },
  });
  await prisma.warranty.create({
    data: { id: "war-3", productId: iP14.id, clienteId: c4.id, motivo: "Pantalla con línea verde", diagnostico: "Fallo en flex de pantalla", status: "ENVIADO_PROVEEDOR", userId: opMed.id, createdAt: new Date("2026-07-05"), updatedAt: new Date("2026-07-10") },
  });
  await prisma.warranty.create({
    data: { id: "war-4", productId: watchS9.id, clienteId: c5.id, motivo: "Corona digital no responde giros", diagnostico: "Suciedad en mecanismo — requiere limpieza", status: "APROBADO", userId: opBog.id, createdAt: new Date("2026-07-12"), updatedAt: new Date("2026-07-14") },
  });

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║               ✅  SEED COMPLETO EXITOSO                  ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║                                                          ║");
  console.log("║  📍  Sucursales:  3 (Medellín, Bogotá, Cali)            ║");
  console.log("║  👤  Usuarios:    3 (admin + 2 operadores)              ║");
  console.log("║  📱  Productos:   18 (iPhones, iPads, Watches, etc.)    ║");
  console.log("║  🧑  Clientes:    5                                     ║");
  console.log("║  📋  Prospectos:  5                                     ║");
  console.log("║  🧾  Ventas:      4 (con items + facturas)              ║");
  console.log("║  💰  Cajas:       3 sesiones con movimientos            ║");
  console.log("║  📦  Apartados:   4 (con abonos y seguimientos)         ║");
  console.log("║  🔧  Garantías:   4 (en distintos estados)              ║");
  console.log("║  📦  Mov. Inv.:   22 entradas + 1 salida por venta      ║");
  console.log("║                                                          ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║                                                          ║");
  console.log("║  🔑  Login:  admin@tienda.com / changeme123              ║");
  console.log("║           operador1@tienda.com / changeme123              ║");
  console.log("║           operador2@tienda.com / changeme123              ║");
  console.log("║                                                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
