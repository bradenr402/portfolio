import { JSDOM } from 'jsdom';

export function renderTemplate(template, data) {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, key) => {
    if (data[key] !== undefined) {
      return data[key];
    }
    return '';
  });
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttribute(value = '') {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

export function collapseWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function truncateAtWordBoundary(value = '', maxLength = 160) {
  const text = collapseWhitespace(value);
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : truncated.length;
  const result = truncated.slice(0, cutoff).replace(/[.,;:!?—-]+$/u, '');

  return `${result}…`;
}

export function getFirstParagraphText(html = '') {
  const dom = new JSDOM(`<main>${html}</main>`);
  const paragraph = dom.window.document.querySelector('p');

  return collapseWhitespace(paragraph?.textContent || '');
}

export function buildMetaDescriptionFromHtml(html = '', maxLength = 160) {
  return truncateAtWordBoundary(getFirstParagraphText(html), maxLength);
}

export function buildMetaDescription({ excerpt = '', html = '', fallback = '' } = {}) {
  return collapseWhitespace(excerpt) || buildMetaDescriptionFromHtml(html) || fallback;
}

export function textToSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, '--')
    .replace(/\./g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}
