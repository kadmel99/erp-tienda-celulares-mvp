export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8">
      <div
        className="h-16 w-16 overflow-hidden rounded-full border border-line-strong"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-zona-ios.png"
          alt="Zona iOS"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 38%" }}
        />
      </div>
      <h1 className="text-2xl font-semibold text-ink">Zona iOS — Gestión Comercial</h1>
      <p className="text-ink-soft">Base del proyecto — próximo paso: login y dashboard.</p>
    </main>
  );
}
