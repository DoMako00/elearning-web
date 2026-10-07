import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface AdminSideDrawerProps {
  readonly open: boolean;
  readonly eyebrow: string;
  readonly title: string;
  readonly onClose: () => void;
  readonly className?: string;
  readonly dismissible?: boolean;
  readonly children: ReactNode;
}

export function AdminSideDrawer({
  open,
  eyebrow,
  title,
  onClose,
  className,
  dismissible = true,
  children,
}: AdminSideDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={"admin-side-drawer" + (className ? " " + className : "")}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
    >
      <div className="admin-side-drawer__layout">
        <header className="admin-side-drawer__header">
          <div>
            <span>{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            disabled={!dismissible}
            aria-label={"Close " + title.toLowerCase()}
            onClick={() => dialogRef.current?.close()}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="admin-side-drawer__body">{children}</div>
      </div>
    </dialog>
  );
}
