"use client";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-6"
        style={{ boxShadow: "var(--shadow-panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            Cancelar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
