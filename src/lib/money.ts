const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un valor en pesos colombianos: "$ 1.499.999" — sin centavos, no se usan en COP. */
export function formatCOP(value: number | string | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value);
  return COP_FORMATTER.format(Number.isFinite(n) ? n : 0);
}
