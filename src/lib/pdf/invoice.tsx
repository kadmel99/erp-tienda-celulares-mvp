import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logo: { width: 50, height: 50 },
  title: { fontSize: 18, fontWeight: "bold" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  label: { color: "#6C685F", marginBottom: 2 },
  value: { fontSize: 11 },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #CFCBC0", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  col40: { width: "40%" },
  col20: { width: "20%", textAlign: "right" },
  col25: { width: "25%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, borderTop: "1 solid #CFCBC0", paddingTop: 8 },
  totalLabel: { marginRight: 40, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  qrBlock: { alignItems: "center", marginTop: 6 },
  qrImage: { width: 64, height: 64 },
  qrCaption: { fontSize: 7, color: "#99958A", marginTop: 2, width: 64, textAlign: "center" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#99958A", fontSize: 8 },
});

export function InvoicePDF({ invoice }: {
  invoice: {
    numero: number;
    createdAt: Date;
    sucursal: { nombre: string; ciudad: string };
    vendedorNombre?: string | null;
    qrDataUrl?: string | null;
    sale: {
      total: number;
      metodoPago: string;
      cliente?: { nombre: string; telefono?: string | null; cedula?: string | null; direccion?: string | null } | null;
      items: {
        product: { nombre: string; modelo?: string | null; imei?: string | null; tieneGarantia?: boolean; mesesGarantia?: number | null };
        precioUnit: number;
        cantidad: number;
      }[];
    };
  };
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Zona iOS</Text>
            <Text>Venta de iPhone y accesorios</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Factura #{invoice.numero}</Text>
            <Text>{new Date(invoice.createdAt).toLocaleDateString("es-CO")}</Text>
            {invoice.qrDataUrl && (
              <View style={styles.qrBlock}>
                <Image src={invoice.qrDataUrl} style={styles.qrImage} />
                <Text style={styles.qrCaption}>Escanea para ver tu factura digital</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.label}>Sucursal</Text>
            <Text style={styles.value}>{invoice.sucursal.nombre}</Text>
            <Text style={styles.value}>{invoice.sucursal.ciudad}</Text>
            {invoice.vendedorNombre && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Vendedor</Text>
                <Text style={styles.value}>{invoice.vendedorNombre}</Text>
              </>
            )}
          </View>
          <View>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{invoice.sale.cliente?.nombre ?? "Consumidor final"}</Text>
            {invoice.sale.cliente?.cedula && <Text style={styles.value}>CC: {invoice.sale.cliente.cedula}</Text>}
            {invoice.sale.cliente?.telefono && <Text style={styles.value}>Tel: {invoice.sale.cliente.telefono}</Text>}
            {invoice.sale.cliente?.direccion && <Text style={styles.value}>{invoice.sale.cliente.direccion}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col40}>Producto</Text>
            <Text style={styles.col20}>Cant.</Text>
            <Text style={styles.col20}>Precio unit.</Text>
            <Text style={styles.col20}>Total</Text>
          </View>
          {invoice.sale.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col40}>
                {item.product.nombre}{item.product.modelo ? ` ${item.product.modelo}` : ""}
                {item.product.imei ? `\nIMEI: ${item.product.imei}` : ""}
                {item.product.tieneGarantia && item.product.mesesGarantia
                  ? `\nGarantía: ${item.product.mesesGarantia} meses`
                  : ""}
              </Text>
              <Text style={styles.col20}>{item.cantidad}</Text>
              <Text style={styles.col20}>{formatCOP(item.precioUnit)}</Text>
              <Text style={styles.col20}>{formatCOP(Number(item.precioUnit) * item.cantidad)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCOP(invoice.sale.total)}</Text>
        </View>

        <Text style={{ marginTop: 10, color: "#6C685F" }}>
          Forma de pago: {invoice.sale.metodoPago === "EFECTIVO" ? "Efectivo" : invoice.sale.metodoPago === "TRANSFERENCIA" ? "Transferencia" : invoice.sale.metodoPago === "TARJETA" ? "Tarjeta" : "Mixto"}
        </Text>

        <Text style={styles.footer}>
          Esta factura es un documento interno de Zona iOS. No es factura electr&oacute;nica DIAN.
        </Text>
      </Page>
    </Document>
  );
}
