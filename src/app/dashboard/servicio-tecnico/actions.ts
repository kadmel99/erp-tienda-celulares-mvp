"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { requireWriteAccess } from "@/lib/authz";
import { OrdenServicioPDF } from "@/lib/pdf/orden-servicio";
import type { ServicioTecnicoStatus, InventoryMovementType, CashMovementType } from "@/generated/prisma/enums";

function revalidateServicioTecnico() {
  revalidatePath("/dashboard/servicio-tecnico");
}

export async function crearServicio(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const sucursalId = formData.get("sucursalId") as string;
  const clienteId = formData.get("clienteId") as string;
  const tecnicoId = formData.get("tecnicoId") as string;
  const userId = formData.get("userId") as string;
  const marca = (formData.get("marca") as string)?.trim();
  const modelo = (formData.get("modelo") as string)?.trim();
  const color = (formData.get("color") as string)?.trim() || null;
  const imei = (formData.get("imei") as string)?.trim() || null;
  const claveDesbloqueo = (formData.get("claveDesbloqueo") as string)?.trim() || null;
  const falla = (formData.get("falla") as string)?.trim();
  const condicionFisica = (formData.get("condicionFisica") as string)?.trim() || null;
  const accesorios = (formData.get("accesorios") as string)?.trim() || null;

  if (!sucursalId || !clienteId || !tecnicoId || !userId || !marca || !modelo || !falla) {
    return { error: "Faltan campos obligatorios" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.servicioTecnico.findFirst({
        where: { sucursalId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const numero = (last?.numero ?? 0) + 1;

      return tx.servicioTecnico.create({
        data: {
          numero,
          sucursalId,
          clienteId,
          tecnicoId,
          userId,
          marca,
          modelo,
          color,
          imei,
          claveDesbloqueo,
          falla,
          condicionFisica,
          accesorios,
        },
      });
    });

    revalidateServicioTecnico();
    return { success: true, id: result.id, numero: result.numero };
  } catch {
    return { error: "Error al crear la orden de servicio" };
  }
}

export async function cambiarEstado(id: string, status: string) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  try {
    await prisma.$transaction(async (tx) => {
      const orden = await tx.servicioTecnico.findUniqueOrThrow({ where: { id } });

      if (status === "ENTREGADO") {
        await tx.servicioTecnico.update({
          where: { id },
          data: { status: status as ServicioTecnicoStatus, entregadoEn: new Date() },
        });

        if (orden.costoFinal != null) {
          const session = await tx.cashRegisterSession.findFirst({
            where: { sucursalId: orden.sucursalId, cerradaEn: null },
          });
          if (session) {
            await tx.cashMovement.create({
              data: {
                sessionId: session.id,
                tipo: "INGRESO_SERVICIO_TECNICO" as CashMovementType,
                monto: orden.costoFinal,
                concepto: `Servicio técnico #${orden.numero}`,
                referenceId: orden.id,
              },
            });
          }
        }
      } else {
        await tx.servicioTecnico.update({
          where: { id },
          data: { status: status as ServicioTecnicoStatus },
        });
      }
    });

    revalidateServicioTecnico();
    revalidatePath("/dashboard/caja");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el estado" };
  }
}

export async function guardarDiagnostico(id: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const diagnostico = (formData.get("diagnostico") as string)?.trim() || null;
  const costoEstimadoRaw = formData.get("costoEstimado") as string;
  const fechaPromesaRaw = formData.get("fechaPromesa") as string;
  const costoFinalRaw = formData.get("costoFinal") as string;
  const garantiaDiasRaw = formData.get("garantiaDias") as string;

  try {
    await prisma.servicioTecnico.update({
      where: { id },
      data: {
        diagnostico,
        costoEstimado: costoEstimadoRaw ? Number(costoEstimadoRaw) : null,
        fechaPromesa: fechaPromesaRaw ? new Date(fechaPromesaRaw) : null,
        costoFinal: costoFinalRaw ? Number(costoFinalRaw) : null,
        garantiaDias: garantiaDiasRaw ? Number(garantiaDiasRaw) : null,
      },
    });
    revalidateServicioTecnico();
    return { success: true };
  } catch {
    return { error: "Error al guardar el diagnóstico" };
  }
}

export async function agregarRepuesto(servicioId: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const productId = (formData.get("productId") as string) || null;
  const nombre = (formData.get("nombre") as string)?.trim();
  const cantidad = Number(formData.get("cantidad")) || 1;
  const costoUnitario = Number(formData.get("costoUnitario"));

  if (!nombre || !costoUnitario || cantidad < 1) {
    return { error: "Datos de repuesto incompletos" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.servicioTecnicoRepuesto.create({
        data: { servicioId, productId, nombre, cantidad, costoUnitario },
      });

      if (productId) {
        const producto = await tx.product.findUniqueOrThrow({
          where: { id: productId },
          select: { cantidad: true },
        });
        if (producto.cantidad < cantidad) {
          throw new Error("Stock insuficiente");
        }
        const nuevaCantidad = producto.cantidad - cantidad;
        await tx.product.update({
          where: { id: productId },
          data: { cantidad: nuevaCantidad, disponible: nuevaCantidad > 0 },
        });
        await tx.inventoryMovement.create({
          data: {
            productId,
            tipo: "SALIDA" as InventoryMovementType,
            cantidad,
            referenceType: "servicio_tecnico",
            referenceId: servicioId,
            userId: (formData.get("userId") as string) ?? "",
          },
        });
      }
    });

    revalidateServicioTecnico();
    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch {
    return { error: "Error al agregar el repuesto" };
  }
}

export async function eliminarRepuesto(repuestoId: string, userId: string) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  try {
    await prisma.$transaction(async (tx) => {
      const repuesto = await tx.servicioTecnicoRepuesto.findUniqueOrThrow({ where: { id: repuestoId } });

      if (repuesto.productId) {
        await tx.product.update({
          where: { id: repuesto.productId },
          data: { cantidad: { increment: repuesto.cantidad }, disponible: true },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: repuesto.productId,
            tipo: "ENTRADA" as InventoryMovementType,
            cantidad: repuesto.cantidad,
            motivo: "Repuesto retirado de la orden de servicio",
            referenceType: "servicio_tecnico",
            referenceId: repuesto.servicioId,
            userId,
          },
        });
      }

      await tx.servicioTecnicoRepuesto.delete({ where: { id: repuestoId } });
    });

    revalidateServicioTecnico();
    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el repuesto" };
  }
}

export async function agregarSeguimiento(servicioId: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const nota = (formData.get("nota") as string)?.trim();
  const userId = formData.get("userId") as string;

  if (!nota || !userId) return { error: "Falta la nota" };

  try {
    await prisma.servicioTecnicoSeguimiento.create({
      data: { servicioId, nota, userId },
    });
    revalidateServicioTecnico();
    return { success: true };
  } catch {
    return { error: "Error al agregar el seguimiento" };
  }
}

export async function getOrdenPDFUrl(id: string): Promise<string | { error: string }> {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const orden = await prisma.servicioTecnico.findUnique({
    where: { id },
    include: {
      sucursal: { select: { nombre: true, ciudad: true } },
      cliente: { select: { nombre: true, telefono: true, cedula: true } },
      repuestos: { select: { nombre: true, cantidad: true, costoUnitario: true } },
    },
  });

  if (!orden) return { error: "Orden no encontrada" };

  try {
    const stream = await (renderToStream as (el: React.ReactElement) => ReturnType<typeof renderToStream>)(
      React.createElement(OrdenServicioPDF, {
        orden: {
          numero: orden.numero,
          createdAt: orden.createdAt,
          status: orden.status,
          sucursal: orden.sucursal,
          cliente: orden.cliente,
          marca: orden.marca,
          modelo: orden.modelo,
          color: orden.color,
          imei: orden.imei,
          claveDesbloqueo: orden.claveDesbloqueo,
          falla: orden.falla,
          condicionFisica: orden.condicionFisica,
          accesorios: orden.accesorios,
          diagnostico: orden.diagnostico,
          costoEstimado: orden.costoEstimado ? Number(orden.costoEstimado) : null,
          fechaPromesa: orden.fechaPromesa,
          costoFinal: orden.costoFinal ? Number(orden.costoFinal) : null,
          garantiaDias: orden.garantiaDias,
          repuestos: orden.repuestos.map((r) => ({
            nombre: r.nombre,
            cantidad: r.cantidad,
            costoUnitario: Number(r.costoUnitario),
          })),
        },
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const base64 = Buffer.concat(chunks).toString("base64");
    return `data:application/pdf;base64,${base64}`;
  } catch {
    return { error: "Error al generar PDF" };
  }
}
