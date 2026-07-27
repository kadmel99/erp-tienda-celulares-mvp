"use client";

import { useActionState, useMemo, useState } from "react";
import Modal from "@/components/modal";
import { createSale, createClient } from "./actions";
import { formatCOP } from "@/lib/money";

type Product = {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  capacidad: string | null;
  imei: string | null;
  condicion: string;
  cantidad: number;
  precioVenta: { toString: () => string };
};

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
};

type CartItem = {
  productId: string;
  nombre: string;
  price: number;
  qty: number;
  maxQty: number;
  esLote: boolean;
};

const CATEGORIAS_SERIALIZADAS = new Set(["IPHONE", "IPAD", "APPLE_WATCH", "AIRPODS"]);

type Props = {
  products: Product[];
  clients: Cliente[];
  sucursalId: string;
  userId: string;
  cajaAbierta: boolean;
};

const CATEGORIAS = [
  "IPHONE", "IPAD", "APPLE_WATCH", "AIRPODS",
  "FORRO", "CARGADOR", "VIDRIO", "ACCESORIO",
] as const;

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "MIXTO", label: "Mixto" },
] as const;

export function PosClient({ products, clients, sucursalId, userId, cajaAbierta }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [clienteId, setClienteId] = useState("");
  const [showSuccess, setShowSuccess] = useState<{ saleId: string; numero: number } | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return products.filter((p) => {
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.imei?.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.modelo?.toLowerCase().includes(q)
      );
    });
  }, [products, busqueda, filtroCategoria]);

  const totalCart = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addToCart(p: Product) {
    const esLote = !CATEGORIAS_SERIALIZADAS.has(p.categoria);
    const existente = cart.find((i) => i.productId === p.id);
    if (existente) {
      if (!esLote || existente.qty >= existente.maxQty) return;
      setCart(cart.map((i) => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      return;
    }
    setCart([...cart, {
      productId: p.id,
      nombre: `${p.nombre}${p.modelo ? ` ${p.modelo}` : ""}${p.capacidad ? ` (${p.capacidad})` : ""}`,
      price: Number(p.precioVenta),
      qty: 1,
      maxQty: p.cantidad,
      esLote,
    }]);
  }

  function changeQty(productId: string, delta: number) {
    setCart(cart.map((i) => {
      if (i.productId !== productId) return i;
      const qty = Math.min(Math.max(i.qty + delta, 1), i.maxQty);
      return { ...i, qty };
    }));
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((i) => i.productId !== productId));
  }

  if (!cajaAbierta) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
          style={{ boxShadow: "var(--shadow-panel)" }}>
          <p className="mb-2 text-lg font-semibold text-[var(--color-ink)]">Caja cerrada</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Debes abrir caja antes de poder realizar ventas.
          </p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
          style={{ boxShadow: "var(--shadow-panel)" }}>
          <div className="mb-3 text-3xl text-[var(--color-success)]">✓</div>
          <h2 className="mb-1 text-lg font-semibold text-[var(--color-ink)]">Venta registrada</h2>
          <p className="mb-6 text-sm text-[var(--color-ink-soft)]">
            Factura #{showSuccess.numero} generada exitosamente.
          </p>
          <button
            onClick={() => { setShowSuccess(null); setCart([]); setClienteId(""); }}
            className="rounded-[12px] border-none px-6 py-2.5 text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
            }}
          >
            Nueva venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4 p-4">
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex gap-3">
          <input
            placeholder="Buscar por nombre, IMEI, SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoFocus
            className="min-w-0 flex-1 rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          >
            <option value="">Todo</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => {
              const esLote = !CATEGORIAS_SERIALIZADAS.has(p.categoria);
              const enCarrito = cart.find((i) => i.productId === p.id);
              const agotadoEnCarrito = !!enCarrito && (!esLote || enCarrito.qty >= enCarrito.maxQty);
              return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={agotadoEnCarrito}
                className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-left transition-all hover:border-[var(--color-accent)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: "var(--shadow-panel)" }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent-deep)]">
                    {p.categoria}
                  </span>
                  {p.condicion !== "NUEVO" && (
                    <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-danger)]">
                      {p.condicion}
                    </span>
                  )}
                  {esLote && (
                    <span className="rounded-full bg-[var(--color-panel-raised)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">
                      {p.cantidad} disp.
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{p.nombre}</div>
                {p.modelo && <div className="text-xs text-[var(--color-ink-faint)]">{p.modelo}{p.capacidad ? ` (${p.capacidad})` : ""}</div>}
                {p.imei && <div className="mt-0.5 font-mono text-[10px] text-[var(--color-ink-faint)]">IMEI: {p.imei}</div>}
                <div className="mt-1.5 text-sm font-bold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCOP(p.precioVenta)}
                </div>
              </button>
              );
            })}
            {filtrados.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[var(--color-ink-faint)]">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-80 flex-col rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <div className="border-b border-[var(--color-line)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Ticket ({cart.length} {cart.length === 1 ? "item" : "items"})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">
              Selecciona productos para iniciar la venta
            </p>
          )}
          {cart.map((item) => (
            <div key={item.productId} className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--color-ink)]">{item.nombre}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-ink-soft)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCOP(item.price * item.qty)}
                  </span>
                  {item.esLote && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => changeQty(item.productId, -1)}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line)] text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-panel-raised)]">
                        &minus;
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {item.qty}
                      </span>
                      <button type="button" onClick={() => changeQty(item.productId, 1)} disabled={item.qty >= item.maxQty}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line)] text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-panel-raised)] disabled:opacity-40">
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="shrink-0 rounded-full p-1 text-xs text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[var(--color-line)] p-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-soft)]">Total</span>
              <span className="text-lg font-bold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCOP(totalCart)}
              </span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="mt-3 w-full rounded-[12px] border-none py-2.5 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
              }}
            >
              Cobrar
            </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={totalCart}
          clients={clients}
          sucursalId={sucursalId}
          userId={userId}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          clienteId={clienteId}
          setClienteId={setClienteId}
          onClose={() => setShowCheckout(false)}
          onSuccess={(result) => setShowSuccess(result)}
          showNewClient={showNewClient}
          setShowNewClient={setShowNewClient}
        />
      )}
    </div>
  );
}

function CheckoutModal({
  cart, total, clients, sucursalId, userId,
  metodoPago, setMetodoPago, clienteId, setClienteId,
  onClose, onSuccess, showNewClient, setShowNewClient,
}: {
  cart: CartItem[];
  total: number;
  clients: Cliente[];
  sucursalId: string;
  userId: string;
  metodoPago: string;
  setMetodoPago: (v: string) => void;
  clienteId: string;
  setClienteId: (v: string) => void;
  onClose: () => void;
  onSuccess: (result: { saleId: string; numero: number }) => void;
  showNewClient: boolean;
  setShowNewClient: (v: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sucursalId", sucursalId);
    fd.set("userId", userId);
    fd.set("items", JSON.stringify(cart.map((i) => ({ productId: i.productId, price: i.price, qty: i.qty }))));
    fd.set("metodoPago", metodoPago);
    fd.set("clienteId", clienteId || "");
    fd.set("total", String(total));
    const result = await createSale(fd);
    if (result && "success" in result && result.success) {
      onSuccess({ saleId: result.saleId as string, numero: result.numero as number });
    }
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  if (showNewClient) {
    return (
      <NewClientModal onClose={() => setShowNewClient(false)} onCreated={(c) => { setClienteId(c.id); setShowNewClient(false); }} />
    );
  }

  return (
    <Modal open title="Confirmar venta" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Resumen
          </p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {cart.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm text-[var(--color-ink)]">
                <span className="truncate">{i.nombre}{i.qty > 1 ? ` ×${i.qty}` : ""}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCOP(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-2 text-base font-bold text-[var(--color-ink)]">
            <span>Total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCOP(total)}</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            M&eacute;todo de pago
          </p>
          <div className="flex flex-wrap gap-2">
            {METODOS_PAGO.map((m) => (
              <button key={m.value} type="button" onClick={() => setMetodoPago(m.value)}
                className={`rounded-[8px] border px-3 py-1.5 text-sm font-medium transition-colors ${
                  metodoPago === m.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]"
                    : "border-[var(--color-line)] bg-[var(--color-panel-raised)] text-[var(--color-ink-soft)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Cliente (opcional)
          </p>
          <div className="flex gap-2">
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
              className="flex-1 rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` - ${c.telefono}` : ""}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowNewClient(true)}
              className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)]"
          >
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{
              background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
            }}
          >
            {isPending ? "Procesando\u2026" : `Cobrar ${formatCOP(total)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewClientModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (c: Cliente) => void;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await createClient(fd);
    if (result && "success" in result && result.success) {
      onCreated(result.client as Cliente);
    }
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Nuevo cliente" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Nombre</label>
          <input name="nombre" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tel&eacute;fono</label>
          <input name="telefono"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Correo</label>
          <input name="correo" type="email"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Guardando\u2026" : "Crear cliente"}
        </button>
      </form>
    </Modal>
  );
}
