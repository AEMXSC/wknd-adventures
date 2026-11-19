import { readBlockConfig } from '../../scripts/aem.js';

/*
 * WKND structured-content list. Renders DA structured-content records (the
 * same records the wknd-next app reads in sc mode) with the site's own
 * featured-article / article-card markup from styles/wknd-shared.css.
 *
 * Config rows (all text is authored, none is hard-coded):
 *   type           adventures | alerts | field-notes   (default adventures)
 *   limit          max records (default 12)
 *   tag            card tag when a record has no pretitle (optional)
 *   empty message  shown when nothing is published or the API fails (optional)
 *
 * Reads the live index on *.aem.live and the preview index everywhere else,
 * like the frescopa26 roast-list block. The Structured Content API is an
 * experimental worker; only GET it (a POST to query.json rebuilds the index).
 */

const SC_API = 'https://sc-api.adobeaem.workers.dev';
const SITE = { org: 'aemxsc', site: 'wknd-adventures' };
const ROOT = '/wknd-next/';
const SCHEMAS = {
  adventures: 'wknd-adventure',
  alerts: 'wknd-trail-alert',
  'field-notes': 'wknd-field-note',
};
const MAX_LIMIT = 50;

export function buildQueryUrl(schema, hostname = window.location.hostname) {
  const tier = hostname.endsWith('.aem.live') || hostname === 'wknd-adventures.com' ? 'live' : 'preview';
  const url = new URL(`${SC_API}/${tier}/${SITE.org}/${SITE.site}/query.json`);
  url.searchParams.set('q', `schemaName:${schema}`);
  url.searchParams.set('limit', '200');
  return url;
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const httpsUrl = (v) => (str(v).startsWith('https://') ? str(v) : '');

export function selectRecords(items, schema, limit) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.metadata?.schemaName === schema && str(item.path).startsWith(ROOT))
    .sort((a, b) => (Number(a.data?.order) || 999) - (Number(b.data?.order) || 999))
    .slice(0, limit);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function image(src, alt, eager) {
  const img = el('img');
  img.src = src;
  img.alt = alt;
  img.width = 1280;
  img.height = 853;
  if (!eager) img.loading = 'lazy';
  return img;
}

function paragraphs(text, className) {
  const wrap = el('div', className);
  str(text).split(/\n\s*\n/).filter(Boolean).forEach((p) => wrap.append(el('p', '', p.trim())));
  return wrap;
}

function link(href, className, label) {
  const a = el('a', className, label);
  a.href = href;
  return a;
}

function featuredAdventure(d) {
  const article = el('article', 'featured-article');
  if (httpsUrl(d.image)) {
    const media = el('div', 'featured-article-image');
    media.append(image(httpsUrl(d.image), str(d.imageAlt) || str(d.headline), true));
    article.append(media);
  }
  const body = el('div', 'wknd-sc-list-featured-body');
  if (str(d.pretitle)) body.append(el('p', 'tag', str(d.pretitle)));
  body.append(el('h2', 'h2-heading', str(d.headline)));
  body.append(paragraphs(d.detail, 'paragraph-lg utility-text-secondary'));
  if (httpsUrl(d.ctaUrl) && str(d.callToAction)) body.append(link(httpsUrl(d.ctaUrl), 'accent-button', str(d.callToAction)));
  article.append(body);
  return article;
}

function card(d, { tag, bodyField }) {
  const href = httpsUrl(d.ctaUrl);
  const root = href ? link(href, 'article-card') : el('article', 'article-card');
  if (httpsUrl(d.image)) {
    const media = el('div', 'article-card-image');
    media.append(image(httpsUrl(d.image), str(d.imageAlt) || str(d.headline), false));
    root.append(media);
  }
  const body = el('div', 'article-card-body');
  const tagText = str(d.pretitle) || tag;
  if (tagText) {
    const meta = el('div', 'article-card-meta');
    meta.append(el('div', 'tag', tagText));
    body.append(meta);
  }
  body.append(el('h3', 'h6-heading utility-margin-bottom-sm', str(d.headline)));
  body.append(paragraphs(d[bodyField], 'paragraph-sm utility-text-secondary'));
  if (href && str(d.callToAction)) body.append(el('span', 'text-button', str(d.callToAction)));
  root.append(body);
  return root;
}

function alertCard(d) {
  const item = el('li', 'wknd-sc-list-alert');
  const icon = el('span', 'wknd-sc-list-alert-icon');
  icon.setAttribute('aria-hidden', 'true');
  const body = el('div');
  body.append(el('h3', 'wknd-sc-list-alert-title', str(d.title)));
  body.append(paragraphs(d.details, 'wknd-sc-list-alert-body'));
  item.append(icon, body);
  return item;
}

export function render(type, records, tag = '') {
  const data = records.map((r) => r.data ?? {});
  if (type === 'alerts') {
    const list = el('ul', 'wknd-sc-list-alerts');
    data.forEach((d) => list.append(alertCard(d)));
    return [list];
  }
  if (type === 'field-notes') {
    const grid = el('div', 'grid-layout desktop-3-column grid-gap-md');
    data.forEach((d) => grid.append(card(d, { tag, bodyField: 'main' })));
    return [grid];
  }
  const featured = data.filter((d) => d.layout === 'featured').map(featuredAdventure);
  const standard = data.filter((d) => d.layout !== 'featured');
  // Three across only when the cards fill every row, like the wknd-next app.
  const grid = el('div', `grid-layout grid-gap-md${standard.length % 3 === 0 ? ' desktop-3-column' : ''}`);
  standard.forEach((d) => grid.append(card(d, { tag, bodyField: 'detail' })));
  return [...featured, grid];
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const type = Object.hasOwn(SCHEMAS, config.type) ? config.type : 'adventures';
  const limit = Math.min(Math.max(Number.parseInt(config.limit, 10) || 12, 1), MAX_LIMIT);
  const schema = SCHEMAS[type];
  const tag = str(config.tag);
  const emptyMessage = str(config['empty-message']);
  const showEmpty = () => { if (emptyMessage) block.append(el('p', 'wknd-sc-list-empty', emptyMessage)); };
  block.textContent = '';
  block.classList.add(`wknd-sc-list-${type}`);
  try {
    const resp = await fetch(buildQueryUrl(schema));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const records = selectRecords(json?.data, schema, limit);
    if (!records.length) {
      showEmpty();
      return;
    }
    block.append(...render(type, records, tag));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('wknd-sc-list: could not load structured content', error);
    showEmpty();
  }
}
