import { getPrisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/money";
import { FacturaViewClient } from "./factura-view-client";

export default async function FacturaPublicaPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const prisma = getPrisma();
  if (!prisma) {
    return <PageShell><p className="text-[var(--color-ink-soft)]">Error de conexión</p></PageShell>;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      sucursal: { select: { nombre: true, ciudad: true } },
      sale: {
        include: {
          cliente: { select: { nombre: true } },
          items: { include: { product: { select: { nombre: true, modelo: true } } } },
        },
      },
    },
  });

  if (!invoice) {
    return (
      <PageShell>
        <p className="text-[var(--color-ink-soft)]">Factura no encontrada.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Factura #{invoice.numero}</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {invoice.sucursal.nombre} — {invoice.sucursal.ciudad}
          </p>
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {new Date(invoice.createdAt).toLocaleDateString("es-CO")}
        </p>
      </div>

      <div className="mb-6 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Cliente</p>
        <p className="text-sm text-[var(--color-ink)]">{invoice.sale.cliente?.nombre ?? "Consumidor final"}</p>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {invoice.sale.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-ink)]">
              {item.product.nombre}{item.product.modelo ? ` ${item.product.modelo}` : ""}
              {item.cantidad > 1 ? ` × ${item.cantidad}` : ""}
            </span>
            <span className="text-[var(--color-ink-soft)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCOP(Number(item.precioUnit) * item.cantidad)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-8 flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <span className="text-sm font-semibold text-[var(--color-ink)]">Total</span>
        <span className="text-lg font-bold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCOP(invoice.sale.total)}
        </span>
      </div>

      <FacturaViewClient invoiceId={invoice.id} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="rounded-[16px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="mb-6 flex flex-col items-center gap-2">
            <div
              className="w-20 overflow-hidden rounded-[14px] border border-[var(--color-line-strong)]"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28)" }}
            >
              <img src="/logo-zona-ios.png" alt="Zona iOS" className="block h-auto w-full" />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
