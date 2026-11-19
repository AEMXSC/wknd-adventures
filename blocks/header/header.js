/**
 * Loads the template-specific header fragment from the code bus.
 * Each overlay-controlled page sets main.dataset.overlay = <template>
 * during loadEager; we read it here to pick the right fragment.
 * Fragments live at /fragments/<template>/header.html.
 */
import { getMetadata } from '../../scripts/aem.js';

// Pages without a template (e.g. /trip-companion) can borrow a template's
// chrome with page metadata 'chrome-template' (a template slug).
const SLUG = /^[a-z0-9-]+$/;

export default async function decorate(block) {
  const fallback = getMetadata('chrome-template');
  const template = document.querySelector('main')?.dataset?.overlay || (SLUG.test(fallback) ? fallback : '');
  if (!template) return;
  const path = `/fragments/${template}/header.html`;
  const resp = await fetch(`${window.hlx.codeBasePath}${path}`);
  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.warn(`[header] fragment not found at ${path}`);
    return;
  }
  block.innerHTML = await resp.text();
}
