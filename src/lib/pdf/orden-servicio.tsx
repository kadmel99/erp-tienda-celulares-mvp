import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontWeight: "bold" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#6C685F", marginBottom: 4, textTransform: "uppercase" },
  label: { color: "#6C685F", marginBottom: 2 },
  value: { fontSize: 11 },
  table: { marginTop: 6 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #CFCBC0", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  col50: { width: "50%" },
  col20: { width: "20%", textAlign: "right" },
  col30: { width: "30%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14, borderTop: "1 solid #CFCBC0", paddingTop: 8 },
  totalLabel: { marginRight: 40, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#99958A", fontSize: 8 },
});

const STATUS_LABEL: Record<string, string> = {
  RECIBIDO: "Recibido",
  DIAGNOSTICO: "En diagnóstico",
  COTIZADO: "Cotizado",
  APROBADO: "Aprobado",
  EN_REPARACION: "En reparación",
  ESPERANDO_REPUESTO: "Esperando repuesto",
  LISTO: "Listo para entrega",
  ENTREGADO: "Entregado",
  NO_APROBADO: "No aprobado por el cliente",
  NO_REPARABLE: "No reparable",
  CANCELADO: "Cancelado",
};

export function OrdenServicioPDF({ orden }: {
  orden: {
    numero: number;
    createdAt: Date;
    status: string;
    sucursal: { nombre: string; ciudad: string };
    cliente: { nombre: string; telefono?: string | null; cedula?: string | null };
    marca: string;
    modelo: string;
    color?: string | null;
    imei?: string | null;
    claveDesbloqueo?: string | null;
    falla: string;
    condicionFisica?: string | null;
    accesorios?: string | null;
    diagnostico?: string | null;
    costoEstimado?: number | null;
    fechaPromesa?: Date | null;
    costoFinal?: number | null;
    garantiaDias?: number | null;
    repuestos: { nombre: string; cantidad: number; costoUnitario: number }[];
  };
}) {
  const totalRepuestos = orden.repuestos.reduce((s, r) => s + r.costoUnitario * r.cantidad, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Zona iOS</Text>
            <Text>Servicio técnico</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Orden #{orden.numero}</Text>
            <Text>{new Date(orden.createdAt).toLocaleDateString("es-CO")}</Text>
            <Text>{STATUS_LABEL[orden.status] ?? orden.status}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.label}>Sucursal</Text>
            <Text style={styles.value}>{orden.sucursal.nombre}</Text>
            <Text style={styles.value}>{orden.sucursal.ciudad}</Text>
          </View>
          <View>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{orden.cliente.nombre}</Text>
            {orden.cliente.cedula && <Text style={styles.value}>CC: {orden.cliente.cedula}</Text>}
            {orden.cliente.telefono && <Text style={styles.value}>Tel: {orden.cliente.telefono}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipo</Text>
          <Text style={styles.value}>{orden.marca} {orden.modelo}{orden.color ? ` — ${orden.color}` : ""}</Text>
          {orden.imei && <Text style={styles.value}>IMEI: {orden.imei}</Text>}
          {orden.claveDesbloqueo && <Text style={styles.value}>Clave de desbloqueo: {orden.claveDesbloqueo}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Falla reportada</Text>
          <Text style={styles.value}>{orden.falla}</Text>
        </View>

        {orden.condicionFisica && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condición física al recibir</Text>
            <Text style={styles.value}>{orden.condicionFisica}</Text>
          </View>
        )}

        {orden.accesorios && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accesorios entregados</Text>
            <Text style={styles.value}>{orden.accesorios}</Text>
          </View>
        )}

        {orden.diagnostico && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            <Text style={styles.value}>{orden.diagnostico}</Text>
          </View>
        )}

        {orden.repuestos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repuestos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col50}>Descripción</Text>
                <Text style={styles.col20}>Cant.</Text>
                <Text style={styles.col30}>Total</Text>
              </View>
              {orden.repuestos.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.col50}>{r.nombre}</Text>
                  <Text style={styles.col20}>{r.cantidad}</Text>
                  <Text style={styles.col30}>{formatCOP(r.costoUnitario * r.cantidad)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {orden.costoFinal != null ? "Costo final" : orden.costoEstimado != null ? "Costo estimado" : "Costo"}
          </Text>
          <Text style={styles.totalValue}>
            {formatCOP(orden.costoFinal ?? orden.costoEstimado ?? totalRepuestos)}
          </Text>
        </View>

        {orden.fechaPromesa && (
          <Text style={{ marginTop: 10, color: "#6C685F" }}>
            Fecha estimada de entrega: {new Date(orden.fechaPromesa).toLocaleDateString("es-CO")}
          </Text>
        )}
        {orden.garantiaDias != null && (
          <Text style={{ marginTop: 4, color: "#6C685F" }}>
            Garantía de la reparación: {orden.garantiaDias} días
          </Text>
        )}

        <Text style={styles.footer}>
          Este comprobante es un documento interno de Zona iOS. Presentar esta orden para reclamar el equipo.
        </Text>
      </Page>
    </Document>
  );
}
