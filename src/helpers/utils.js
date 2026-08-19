import fs from 'fs';
import { JSDOM } from 'jsdom';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPngDimensions(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;

  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readWebpDimensions(buffer) {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }

  const format = buffer.toString('ascii', 12, 16);

  // Lossy (VP8): 3-byte frame tag + 3-byte sync code precede the dimensions
  if (format === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  // Lossless (VP8L): a single 32-bit LE value packs both 14-bit dimensions
  if (format === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  // Extended (VP8X): dimensions are two 24-bit LE values
  if (format === 'VP8X') {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1,
    };
  }

  return null;
}

// Reads intrinsic width/height directly from a PNG/WEBP file on disk so build
// output can include `width`/`height` attributes without guessing.
export function getImageDimensions(filePath) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return null;
  }

  return readPngDimensions(buffer) || readWebpDimensions(buffer) || null;
}

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
