import { Construction } from "lucide-react";

export function AdminPagePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="admin-page admin-placeholder-page" aria-label={title}><div className="admin-placeholder" role="status"><Construction aria-hidden="true" /><div><h2>{title} foundation ready</h2><p>{description} The detailed view will be implemented in a later milestone.</p></div><span className="admin-placeholder__badge">Coming next</span></div></section>;
}
