import { Construction } from "lucide-react";

export function AdminPagePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="admin-page" aria-labelledby="admin-placeholder-title"><header className="admin-page__heading"><div><p className="admin-eyebrow">Admin section</p><h1 id="admin-placeholder-title">{title}</h1><p className="admin-page__description">{description}</p></div></header><div className="admin-placeholder" role="status"><Construction aria-hidden="true" /><div><h2>Read-only foundation ready</h2><p>Detailed {title.toLowerCase()} views will be connected to the backend contract in a later step.</p></div><span className="admin-placeholder__badge">Coming next</span></div></section>;
}