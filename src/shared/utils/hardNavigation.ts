/**
 * Full-document navigations used when an authenticated identity ends or
 * changes. A full load guarantees no in-memory state from the previous
 * student survives. Kept in one module so the behaviour can be tested.
 */
export function assignLocation(url: string): void {
  window.location.assign(url);
}

export function reloadPage(): void {
  window.location.reload();
}
