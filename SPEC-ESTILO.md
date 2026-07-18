# Sistema de estilo — Skeuomorfismo sutil | Spec v1.0

> Mockup de referencia: [artifact publicado](https://claude.ai/code/artifact/4955c7af-8a2f-4f6d-8b9a-566f0263692d) (pantallas de Punto de venta y Dashboard). Este documento formaliza esa dirección visual en tokens implementables.

---

## 1. Filosofía

Skeuomorfismo **sutil y moderno** — no el skeuomorfismo pesado de iOS 6 (cuero, papel, iconos hiperrealistas), sino uno contenido: sombras duales suaves, superficies que sugieren materiales reales, botones con relieve físico. Dos razones concretas para este estilo en este producto:

1. **El personal de mostrador no siempre es técnico** — elementos que "se ven físicos" (un botón que se hunde al presionarlo, un interruptor con perilla) se entienden sin curva de aprendizaje.
2. **El catálogo es de productos Apple** — el lenguaje de materiales (aluminio cepillado + vidrio glossy estilo Aqua/Mac OS X) dialoga con lo que la tienda vende, en vez de un material genérico tipo cuero/madera.

Regla de oro: el relieve se reserva para **controles** (botones, switches, diales, tarjetas de producto). Las zonas de **precios y totales** (el ticket) usan una superficie más plana y de alto contraste — el cajero necesita leer cifras rápido, no admirar la textura.

---

## 2. Paleta

### Modo claro

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#DDDAD3` | Fondo de página — aluminio cepillado (con textura de líneas sutiles) |
| `--panel` | `#F7F6F2` | Superficie de tarjetas/paneles — "vidrio" |
| `--panel-raised` | `#EEEBE3` | Superficie de controles en reposo (inputs, chips) |
| `--panel-raised-hi` | `#F9F7F2` | Highlight superior en superficies con gradiente |
| `--ink` | `#262420` | Texto principal |
| `--ink-soft` | `#6C685F` | Texto secundario |
| `--ink-faint` | `#99958A` | Texto terciario / placeholders |
| `--accent` | `#1E8A9E` | Acento — vidrio Aqua (acciones, progreso, selección) |
| `--accent-deep` | `#146575` | Acento presionado / sombra del botón principal |
| `--accent-hi` | `#4FB6CA` | Highlight superior del acento (gradiente de botones) |
| `--accent-soft` | `#D8ECEF` | Fondo tenue del acento (chips seleccionados, badges) |
| `--success` | `#4C8A5C` | Estados positivos (nuevo, activo) |
| `--success-soft` | `#DEEAE0` | Fondo tenue de éxito |
| `--danger` | `#B8523F` | Estados de alerta (usado, vencido) |
| `--danger-soft` | `#F4DBD4` | Fondo tenue de alerta |
| `--line` | `#CFCBC0` | Borde/hairline por defecto |
| `--line-strong` | `#B3AEA0` | Borde/hairline enfatizado |

### Modo oscuro

| Token | Hex |
|---|---|
| `--bg` | `#1E1D1A` |
| `--panel` | `#2A2925` |
| `--panel-raised` | `#35342C` |
| `--panel-raised-hi` | `#3C3B32` |
| `--ink` | `#ECE9E1` |
| `--ink-soft` | `#AEA99D` |
| `--ink-faint` | `#77736A` |
| `--accent` | `#35A6BB` |
| `--accent-deep` | `#1E7A8C` |
| `--accent-hi` | `#5CC3D6` |
| `--accent-soft` | `#1B3A40` |
| `--success` | `#6BAE79` |
| `--success-soft` | `#253829` |
| `--danger` | `#CC7562` |
| `--danger-soft` | `#3C2721` |
| `--line` | `rgba(255,255,255,0.09)` |
| `--line-strong` | `rgba(255,255,255,0.17)` |

No se usan tokens crudos (`#hex` directo en componentes) — todo pasa por estas variables para que el modo oscuro funcione sin lógica condicional en el código de cada pantalla.

---

## 3. Tipografía

Sistema (sin webfont externa): `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif` — es una elección deliberada, no un fallback accidental: como el catálogo es de productos Apple, usar la pila que se aproxima a San Francisco en cada plataforma refuerza la identidad sin depender de una fuente externa.

| Rol | Tamaño | Peso |
|---|---|---|
| Total del ticket / cifra grande de KPI | 18-21px | 700-800 |
| Título de panel/tarjeta | 15-16px | 600-700 |
| Cuerpo / nombre de producto | 13-14px | 600 |
| Texto secundario | 12-13px | 400-500 |
| Etiqueta/caption (uppercase, tracking) | 11-12px | 600-700, `letter-spacing: 0.05-0.09em` |

Cifras (precios, totales, cantidades) siempre con `font-variant-numeric: tabular-nums` para que las columnas de números alineen.

---

## 4. Materiales y efectos

### 4.1 Fondo — aluminio cepillado
```css
background:
  repeating-linear-gradient(100deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px),
  var(--bg);
```
Textura sutil, nunca decorativa al punto de competir con el contenido.

### 4.2 Paneles/tarjetas — "vidrio flotante"
Bisel + sombra reforzados a propósito (ver iteración con el cliente) para que la tarjeta se perciba flotando sobre el fondo de aluminio, no pegada a él:
```css
background: var(--panel);
border: 1px solid var(--line);
border-radius: 14px;
box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(38,36,32,0.08), 0 16px 32px rgba(38,36,32,0.20);
```
El `inset` superior simula el filo de vidrio; la sombra amplia (16px/32px) es la que da la sensación de flotar — a mayor blur y desplazamiento, más "altura" percibida sobre el fondo.

### 4.3 Controles hundidos (inputs, chips no seleccionados)
```css
background: var(--panel-raised);
box-shadow: inset 0 1px 2px rgba(38,36,32,0.16), inset 0 -1px 0 rgba(255,255,255,0.5);
```

### 4.4 Botón primario con relieve físico
El botón de acción principal (ej. "Cobrar") simula un botón de vidrio glossy que se hunde al presionarse:
```css
background: linear-gradient(180deg, var(--accent-hi), var(--accent) 55%, var(--accent-deep));
box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--accent-deep), 0 6px 14px rgba(20,101,117,0.35);
```
Estado `:active` — se hunde (quita el "step" de 3px, reduce sombra, `transform: translateY(2px)`).

### 4.5 Diales/gauges (KPIs del dashboard)
Anillo de progreso con `conic-gradient(var(--accent) calc(var(--pct) * 1%), var(--panel-raised) 0)` sobre superficie hundida, con un disco interior superpuesto (`::after`) para el efecto de "carátula".

### 4.6 Switches (activar/inactivar sucursal)
Track hundido (`box-shadow: inset ...`), perilla con gradiente blanco y sombra propia; estado "on" cambia el track a gradiente del acento.

### 4.7 Ticket / recibo
Borde superior punteado (`border-bottom: 1px dashed`), fondo con textura de puntos sutil (`radial-gradient` de puntos pequeños) simulando el borde perforado de un rollo de papel. **Zona de precios sin relieve** — fondo plano de `--panel`, texto de alto contraste.

---

## 5. Componentes — reglas rápidas

| Componente | Superficie | Radio | Notas |
|---|---|---|---|
| Panel/tarjeta contenedora | Vidrio (4.2) | 14px | Borde 1px `--line` |
| Tarjeta de producto (POS) | Vidrio con gradiente sutil arriba | 12px | Icono en chip con gradiente oscuro (accesorio: gradiente del acento) |
| Input/búsqueda | Hundido (4.3) | 10px | Sin borde visible, solo sombra interior |
| Chip (método de pago) | Hundido / seleccionado con `--accent-soft` + borde `--accent` | 8px | |
| Botón primario | Relieve físico (4.4) | 12px | Uno solo por pantalla — es la acción principal |
| Botón secundario | Vidrio plano, sin gradiente | 10-12px | |
| Gauge/dial | Anillo cónico + disco (4.5) | circular | Solo en dashboard gerencial |
| Switch | 4.6 | pill (14px+) | |
| Badge de estado (nuevo/usado/exhibición) | `--success-soft`/`--danger-soft` plano | 5-7px | Texto en el tono "deep" del mismo color, nunca negro puro |

---

## 6. Qué NO hacer

- No aplicar relieve/textura a zonas de texto denso (listas de precios, tablas de reportes) — ahí gana la legibilidad plana.
- No usar más de un botón con relieve "primario" por pantalla — si todo tiene relieve, nada se siente como la acción principal.
- No usar colores fuera de esta paleta ni saturaciones altas — el acento Aqua (`--accent`) es el único tono vivo; todo lo demás es neutro cálido.
- No mezclar con neumorfismo (superficies del mismo tono sin bordes) — este sistema sí usa bordes hairline y paneles con tono diferenciado del fondo; son dos técnicas distintas y no se combinan.

---

## 7. Implementación

Los tokens de este documento ya están aplicados en [`src/app/globals.css`](./src/app/globals.css) del proyecto (bloque `@theme` de Tailwind v4). Los componentes se implementan módulo por módulo siguiendo las reglas de la sección 5 — no hace falta una librería de componentes aparte para el MVP.
