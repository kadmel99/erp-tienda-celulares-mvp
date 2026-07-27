"use client";

import { useState } from "react";
import { getInvoicePDFUrl } from "@/app/dashboard/facturacion/actions";

export function FacturaViewClient({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVer() {
    setLoading(true);
    setError(null);
    const result = await getInvoicePDFUrl(invoiceId);
    if (typeof result === "string") window.open(result, "_blank");
    else setError(result.error);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleVer}
        disabled={loading}
        className="btn-skeu-primary w-full rounded-[12px] border-none py-2.5 text-sm font-semibold text-white outline-none disabled:opacity-50"
      >
        {loading ? "Generando PDF…" : "Ver / descargar factura PDF"}
      </button>
      {error && (
        <p className="mt-3 rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
