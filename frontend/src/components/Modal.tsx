import { useId, type PropsWithChildren, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps extends PropsWithChildren {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ title, description, open, onClose, footer, children }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
      role="presentation"
    >
      <div
        className="glass-panel w-full max-w-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-6">
          <div>
            <h3 id={titleId} className="text-xl font-semibold text-white">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 md:px-6">{children}</div>
        {footer ? <div className="border-t border-white/10 px-5 py-5 md:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
