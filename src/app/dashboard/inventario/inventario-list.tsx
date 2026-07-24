"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import Modal from "@/components/modal";
import { createProduct, updateProduct } from "./actions";

const CATEGORIAS = [
  "IPHONE", "IPAD", "APPLE_WATCH", "AIRPODS",
  "FORRO", "CARGADOR", "VIDRIO", "ACCESORIO",
] as const;

const CONDICIONES = ["NUEVO", "USADO", "REACONDICIONADO", "EXHIBICION"] as const;

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
  serial: string | null;
  condicion: string;
  costo: { toString: () => string };
  precioVenta: { toString: () => string };
  tieneGarantia: boolean;
  mesesGarantia: number | null;
  disponible: boolean;
  sucursalId: string;
  sucursal: { nombre: string } | null;
};

type Props = {
  products: Product[];
  sucursales: { id: string; nombre: string }[];
  isAdmin: boolean;
  userSucursalId: string | null;
};

export function InventarioList({ products, sucursales, isAdmin, userSucursalId }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroCondicion, setFiltroCondicion] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Product | null>(null);

  const filtrados = useMemo(() => {
    return products.filter((p) => {
      if (!p.disponible) return false;
      const q = busqueda.toLowerCase();
      if (q && !p.nombre.toLowerCase().includes(q) && !p.imei?.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.modelo?.toLowerCase().includes(q)) return false;
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (filtroCondicion && p.condicion !== filtroCondicion) return false;
      return true;
    });
  }, [products, busqueda, filtroCategoria, filtroCondicion]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Inventario</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{products.length} productos registrados</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}
        >
          Nuevo producto
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Buscar por nombre, IMEI, SKU..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-w-0 flex-1 rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }}
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          style={{ boxShadow: "var(--shadow-inset)" }}
        >
          <option value="">Todas las categor&iacute;as</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroCondicion} onChange={(e) => setFiltroCondicion(e.target.value)}
          className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          style={{ boxShadow: "var(--shadow-inset)" }}
        >
          <option value="">Todas las condiciones</option>
          {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categor&iacute;a</th>
              <th className="px-4 py-3">Condici&oacute;n</th>
              <th className="px-4 py-3">IMEI / SKU</th>
              <th className="px-4 py-3">Precio venta</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No se encontraron productos
                </td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--color-ink)]">{p.nombre}</div>
                  {p.modelo && <div className="text-xs text-[var(--color-ink-faint)]">{p.marca ? `${p.marca} - ` : ""}{p.modelo}{p.capacidad ? ` (${p.capacidad})` : ""}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent-deep)]">
                    {p.categoria}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.condicion === "NUEVO"
                      ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                      : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                  }`}>
                    {p.condicion}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">
                  {p.imei ? <>{p.imei}<br /></> : null}
                  {p.sku}
                </td>
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  ${Number(p.precioVenta).toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">{p.sucursal?.nombre ?? "\u2014"}</td>
                <td className="flex gap-2 px-4 py-3">
                  <button onClick={() => setEditando(p)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    Editar
                  </button>
                  <Link href={`/dashboard/inventario/movimientos?productoId=${p.id}`}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    Mov.
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <ProductoFormModal title="Nuevo producto" sucursales={sucursales} isAdmin={isAdmin}
          defaultSucursalId={userSucursalId} onClose={() => setCreando(false)} />
      )}
      {editando && (
        <ProductoFormModal key={editando.id} title="Editar producto" producto={editando}
          sucursales={sucursales} isAdmin={isAdmin} defaultSucursalId={null} onClose={() => setEditando(null)} />
      )}
    </>
  );
}

function ProductoFormModal({ title, producto, sucursales, isAdmin, defaultSucursalId, onClose }: {
  title: string;
  producto?: Product;
  sucursales: { id: string; nombre: string }[];
  isAdmin: boolean;
  defaultSucursalId: string | null;
  onClose: () => void;
}) {
  const action = producto ? updateProduct.bind(null, producto.id) : createProduct;
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await action(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;
  const [cat, setCat] = useState(producto?.categoria ?? "IPHONE");
  const [tieneGarantia, setTieneGarantia] = useState(producto?.tieneGarantia ?? false);

  return (
    <Modal open title={title} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Nombre</label>
          <input name="nombre" required defaultValue={producto?.nombre ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Categor&iacute;a</label>
            <select name="categoria" required value={cat} onChange={e => setCat(e.target.value)}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Condici&oacute;n</label>
            <select name="condicion" defaultValue={producto?.condicion ?? "NUEVO"}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              {CONDICIONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Marca</label>
            <input name="marca" defaultValue={producto?.marca ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Modelo</label>
            <input name="modelo" defaultValue={producto?.modelo ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Color</label>
            <input name="color" defaultValue={producto?.color ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Capacidad</label>
            <input name="capacidad" placeholder="128GB" defaultValue={producto?.capacidad ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Serial</label>
            <input name="serial" defaultValue={producto?.serial ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">IMEI</label>
          <input name="imei" defaultValue={producto?.imei ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Costo ($)</label>
            <input name="costo" type="number" min="0" step="0.01" required defaultValue={producto ? Number(producto.costo) : ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Precio venta ($)</label>
            <input name="precioVenta" type="number" min="0" step="0.01" required defaultValue={producto ? Number(producto.precioVenta) : ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Sucursal</label>
            <select name="sucursalId" required defaultValue={producto?.sucursalId ?? defaultSucursalId ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              <option value="">Seleccionar sucursal</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input type="checkbox" name="tieneGarantia" checked={tieneGarantia} onChange={e => setTieneGarantia(e.target.checked)}
            className="rounded border-[var(--color-line-strong)] text-[var(--color-accent)]" />
          Tiene garant&iacute;a
        </label>
        {tieneGarantia && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Meses de garant&iacute;a</label>
            <input name="mesesGarantia" type="number" min="1" defaultValue={producto?.mesesGarantia ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }} />
          </div>
        )}

        <input type="hidden" name="disponible" value={producto?.disponible !== false ? "on" : "off"} />

        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}

        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Guardando\u2026" : producto ? "Actualizar" : "Crear"}
        </button>
      </form>
    </Modal>
  );
}
