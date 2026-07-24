import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 16, fontWeight: "bold" },
  meta: { color: "#6C685F", fontSize: 9 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #CFCBC0", paddingBottom: 6, marginBottom: 6, fontWeight: "bold" },
  row: { flexDirection: "row", paddingVertical: 5, borderBottom: "1 solid #EEEBE3" },
  colSucursal: { width: "14%" },
  colTipo: { width: "10%" },
  colSeveridad: { width: "9%" },
  colTitulo: { width: "22%" },
  colDescripcion: { width: "27%" },
  colEstado: { width: "9%" },
  colFecha: { width: "9%" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#99958A", fontSize: 8 },
});

export function HallazgosReportePDF({
  hallazgos,
  generadoEn,
}: {
  hallazgos: {
    sucursal: string;
    tipo: string;
    severidad: string;
    titulo: string;
    descripcion: string;
    status: string;
    autor: string;
    createdAt: Date;
  }[];
  generadoEn: Date;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reporte de Auditor&iacute;a</Text>
            <Text style={styles.meta}>Zona iOS &mdash; Revisi&oacute;n fiscal</Text>
          </View>
          <View>
            <Text style={styles.meta}>Generado: {generadoEn.toLocaleString("es-CO")}</Text>
            <Text style={styles.meta}>{hallazgos.length} hallazgo{hallazgos.length === 1 ? "" : "s"}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colSucursal}>Sucursal</Text>
          <Text style={styles.colTipo}>Tipo</Text>
          <Text style={styles.colSeveridad}>Severidad</Text>
          <Text style={styles.colTitulo}>T&iacute;tulo</Text>
          <Text style={styles.colDescripcion}>Descripci&oacute;n</Text>
          <Text style={styles.colEstado}>Estado</Text>
          <Text style={styles.colFecha}>Fecha</Text>
        </View>
        {hallazgos.map((h, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.colSucursal}>{h.sucursal}</Text>
            <Text style={styles.colTipo}>{h.tipo}</Text>
            <Text style={styles.colSeveridad}>{h.severidad}</Text>
            <Text style={styles.colTitulo}>{h.titulo}</Text>
            <Text style={styles.colDescripcion}>{h.descripcion}</Text>
            <Text style={styles.colEstado}>{h.status === "ABIERTO" ? "Abierto" : "Resuelto"}</Text>
            <Text style={styles.colFecha}>{new Date(h.createdAt).toLocaleDateString("es-CO")}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Documento interno de Zona iOS &mdash; generado por el m&oacute;dulo de Auditor&iacute;a.
        </Text>
      </Page>
    </Document>
  );
}
