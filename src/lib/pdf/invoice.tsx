import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

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
  col50: { width: "50%" },
  col25: { width: "25%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, borderTop: "1 solid #CFCBC0", paddingTop: 8 },
  totalLabel: { marginRight: 40, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#99958A", fontSize: 8 },
});

export function InvoicePDF({ invoice }: {
  invoice: {
    numero: number;
    createdAt: Date;
    sucursal: { nombre: string; ciudad: string };
    sale: {
      total: number;
      metodoPago: string;
      cliente?: { nombre: string; telefono?: string | null } | null;
      items: { product: { nombre: string; modelo?: string | null; imei?: string | null }; precioUnit: number }[];
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
          <View>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Factura #{invoice.numero}</Text>
            <Text>{new Date(invoice.createdAt).toLocaleDateString("es-CO")}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.label}>Sucursal</Text>
            <Text style={styles.value}>{invoice.sucursal.nombre}</Text>
            <Text style={styles.value}>{invoice.sucursal.ciudad}</Text>
          </View>
          <View>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{invoice.sale.cliente?.nombre ?? "Consumidor final"}</Text>
            {invoice.sale.cliente?.telefono && <Text style={styles.value}>Tel: {invoice.sale.cliente.telefono}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col50}>Producto</Text>
            <Text style={styles.col25}>Precio unit.</Text>
            <Text style={[styles.col25, { width: "25%" }]}>Total</Text>
          </View>
          {invoice.sale.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col50}>
                {item.product.nombre}{item.product.modelo ? ` ${item.product.modelo}` : ""}
                {item.product.imei ? `\nIMEI: ${item.product.imei}` : ""}
              </Text>
              <Text style={styles.col25}>${Number(item.precioUnit).toLocaleString("es-CO")}</Text>
              <Text style={[styles.col25, { width: "25%" }]}>${Number(item.precioUnit).toLocaleString("es-CO")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${Number(invoice.sale.total).toLocaleString("es-CO")}</Text>
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
