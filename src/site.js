// site: tiny static-site helpers for the SDLC website
export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPage({ title, body }) {
  return `<!doctype html>\n<html><head><title>${escapeHtml(title)}</title></head><body>${body}</body></html>\n`;
}

export function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")            // strip combining marks left by NFKD
    .replace(/[^\x00-\x7f]/g, "")      // ASCII only (intent constraint)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function renderNav(items) {
  const lis = items.map(({ label, href }) =>
    `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`);
  return `<ul>${lis.join("")}</ul>`;
}

export function renderFooter({ owner, year }) {
  return `<footer>&copy; ${escapeHtml(year)} ${escapeHtml(owner)}</footer>`;
}
