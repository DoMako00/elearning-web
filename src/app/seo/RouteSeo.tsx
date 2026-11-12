import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { identityFor } from "./seoConfig";
import { formatTitle, resolveRouteMeta } from "./routeMeta";

type MetaKey = "name" | "property";

function upsertMeta(attr: MetaKey, key: string, content: string | null) {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (content === null) { element?.remove(); return; }
  if (!element) { element = document.createElement("meta"); element.setAttribute(attr, key); document.head.appendChild(element); }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (href === null) { element?.remove(); return; }
  if (!element) { element = document.createElement("link"); element.setAttribute("rel", rel); document.head.appendChild(element); }
  element.setAttribute("href", href);
}

function upsertJsonLd(data: object | null) {
  const id = "route-seo-jsonld";
  let element = document.getElementById(id);
  if (!data) { element?.remove(); return; }
  if (!element) { element = document.createElement("script"); element.id = id; element.setAttribute("type", "application/ld+json"); document.head.appendChild(element); }
  element.textContent = JSON.stringify(data);
}

/* Applies the title, description, robots rule, canonical link and share tags for the current route.
   Mounted once as the root route element, so every page gets correct tags without editing each page. */
export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const identity = identityFor();
    const meta = resolveRouteMeta(pathname);
    const title = formatTitle(meta, identity.siteName);
    const description = meta.description ?? identity.description;
    const url = `${window.location.origin}${pathname}`;

    document.title = title;
    upsertMeta("name", "description", meta.noindex ? null : description);
    upsertMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", meta.noindex ? null : url);

    upsertMeta("property", "og:site_name", identity.siteName);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", meta.noindex ? null : title);
    upsertMeta("property", "og:description", meta.noindex ? null : description);
    upsertMeta("property", "og:url", meta.noindex ? null : url);
    upsertMeta("property", "og:image", !meta.noindex && identity.ogImage ? identity.ogImage : null);
    upsertMeta("name", "twitter:card", !meta.noindex && identity.ogImage ? "summary_large_image" : "summary");

    upsertJsonLd(meta.area === "public" && !meta.noindex ? {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: identity.siteName,
      url: window.location.origin,
      description: identity.description,
    } : null);
  }, [pathname]);

  return <Outlet />;
}
