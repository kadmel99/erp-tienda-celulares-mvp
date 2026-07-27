"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { InvoicePDF } from "@/lib/pdf/invoice";
import nodemailer from "nodemailer";
import { requireWriteAccess } from "@/lib/authz";
import { formatCOP } from "@/lib/money";

export async function getInvoicePDFUrl(invoiceId: string): Promise<string | { error: string }> {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      sucursal: { select: { nombre: true, ciudad: true } },
      sale: {
        include: {
          cliente: { select: { nombre: true, telefono: true, cedula: true, direccion: true } },
          items: {
            include: {
              product: { select: { nombre: true, modelo: true, imei: true, tieneGarantia: true, mesesGarantia: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) return { error: "Factura no encontrada" };

  const vendedor = await prisma.usuario.findUnique({
    where: { id: invoice.sale.userId },
    select: { nombre: true },
  });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/factura/${invoiceId}`, { width: 180, margin: 1 });

    const stream = await (renderToStream as (el: React.ReactElement) => ReturnType<typeof renderToStream>)(
      React.createElement(InvoicePDF, {
        invoice: {
          numero: invoice.numero,
          createdAt: invoice.createdAt,
          sucursal: invoice.sucursal,
          vendedorNombre: vendedor?.nombre ?? null,
          qrDataUrl,
          sale: {
            total: Number(invoice.sale.total),
            metodoPago: invoice.sale.metodoPago,
            cliente: invoice.sale.cliente,
            items: invoice.sale.items.map((i) => ({
              product: i.product,
              precioUnit: Number(i.precioUnit),
              cantidad: i.cantidad,
            })),
          },
        },
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Store as base64 data URL for now (Supabase Storage integration would go here)
    // For MVP, return a data URL that can be viewed/printed
    const base64 = pdfBuffer.toString("base64");
    const pdfUrl = `data:application/pdf;base64,${base64}`;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl },
    });

    return pdfUrl;
  } catch {
    return { error: "Error al generar PDF" };
  }
}

export async function enviarFacturaEmail(invoiceId: string) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      sucursal: { select: { nombre: true } },
      sale: {
        include: {
          items: { include: { product: { select: { nombre: true, modelo: true } } } },
        },
      },
    },
  });

  if (!invoice) return { error: "Factura no encontrada" };

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || "notificaciones@zonaios.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { error: "SMTP no configurado" };
  }

  try {
    const pdfResult = await getInvoicePDFUrl(invoiceId);
    if (typeof pdfResult === "object" && "error" in pdfResult) {
      return pdfResult;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const itemsHtml = invoice.sale.items
      .map((i) => `<li>${i.product.nombre}${i.product.modelo ? ` ${i.product.modelo}` : ""}</li>`)
      .join("");

    await transporter.sendMail({
      from: smtpFrom,
      to: smtpFrom, // Envía a la contadora (configurable)
      subject: `Factura #${invoice.numero} - ${invoice.sucursal.nombre}`,
      html: `
        <h2>Factura #${invoice.numero}</h2>
        <p><strong>Sucursal:</strong> ${invoice.sucursal.nombre}</p>
        <p><strong>Fecha:</strong> ${invoice.createdAt.toLocaleDateString("es-CO")}</p>
        <p><strong>Total:</strong> ${formatCOP(invoice.sale.total)}</p>
        <h3>Productos:</h3>
        <ul>${itemsHtml}</ul>
        <p>El PDF de la factura se adjunta a este correo.</p>
      `,
      attachments: [
        {
          filename: `factura-${invoice.numero}.pdf`,
          content: pdfResult.split(",")[1],
          encoding: "base64",
        },
      ],
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { enviadaContadoraEn: new Date() },
    });

    revalidatePath("/dashboard/facturacion");
    return { success: true };
  } catch {
    return { error: "Error al enviar email" };
  }
}
