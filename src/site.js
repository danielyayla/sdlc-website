// site: tiny static-site helpers for the SDLC website
export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPage({ title, body }) {
  return `<!doctype html>\n<html><head><title>${escapeHtml(title)}</title></head><body>${body}</body></html>\n`;
}
