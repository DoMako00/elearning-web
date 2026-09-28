import type { ReactNode } from "react";

export function StudentPageRegion({ title, className = "", children }: { title: string; className?: string; children?: ReactNode }) {
  return (
    <section className={`student-page-region ${className}`.trim()} aria-label={title}>
      <span className="student-page-region__label">{title}</span>
      {children}
    </section>
  );
}
