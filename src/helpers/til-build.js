import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Markdoc from '@markdoc/markdoc';

import { processMarkdown } from './blog-build.js';
import { renderTemplate } from './utils.js';
import formatDate from './format-date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const TIL_DIR = path.join(SRC_DIR, 'til');

const TIL_ITEM_TEMPLATE = fs
  .readFileSync(path.join(COMPONENTS_DIR, '_til-item.html'), 'utf8')
  .trim();

const TIL_ACTIONS_TEMPLATE = fs
  .readFileSync(path.join(COMPONENTS_DIR, '_til-actions.html'), 'utf8')
  .trim();

const TIL_ENTRY_TEMPLATE = fs.readFileSync(
  path.join(TIL_DIR, '_template.html'),
  'utf8',
);

// Match `<til-root>/yyyy/mm/dd/slug.md` and capture each part.
const TIL_PATH_REGEX =
  /(?<year>\d{4})[\\/](?<month>\d{2})[\\/](?<day>\d{2})[\\/](?<slug>[^\\/]+?)\.md$/;

function parseTilPath(filePath) {
  const match = filePath.match(TIL_PATH_REGEX);
  if (!match) return null;

  const { year, month, day, slug } = match.groups;
  const date = `${year}-${month}-${day}`;
  const entryPath = `${year}/${month}/${day}/${slug}`;

  return {
    date,
    slug,
    path: entryPath,
    href: `/til/${entryPath}`,
    domId: `til-${entryPath.replace(/\//g, '-')}`,
  };
}

function renderInlineMarkdown(text) {
  const ast = Markdoc.parse(text);
  const transformed = Markdoc.transform(ast);
  const html = Markdoc.renderers.html(transformed);
  // Markdoc wraps single-line content in <article><p>…</p></article>.
  // Unwrap so the title renders inline inside an <h2> / <h1>.
  return html.replace(/^<article>\s*<p>/, '').replace(/<\/p>\s*<\/article>$/, '');
}

function renderActions(link) {
  if (!link) return '';

  return renderTemplate(TIL_ACTIONS_TEMPLATE, { link });
}

function collectTilEntries(tilDir) {
  const entries = [];

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const dirents = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const dirent of dirents) {
      const entryPath = path.join(currentDir, dirent.name);

      if (dirent.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (!(dirent.isFile() && dirent.name.endsWith('.md'))) continue;

      const parsed = parseTilPath(entryPath);
      if (!parsed) continue;

      const rawContent = fs.readFileSync(entryPath, 'utf8');
      const { html, metadata } = processMarkdown(rawContent, entryPath);

      entries.push({
        slug: parsed.slug,
        path: parsed.path,
        href: parsed.href,
        domId: parsed.domId,
        date: parsed.date,
        sortValue: `${parsed.date}-${parsed.slug}`,
        title: metadata.title || parsed.slug,
        link: metadata.link || '',
        contentHtml: html ? html.trim() : '',
        filePath: entryPath,
      });
    }
  }

  walk(tilDir);
  entries.sort((a, b) => b.sortValue.localeCompare(a.sortValue));
  return entries;
}

function renderTilEntryHtml(entry) {
  const content = entry.contentHtml
    ? `<div class="til-item__content">${entry.contentHtml}</div>`
    : '';

  return renderTemplate(TIL_ITEM_TEMPLATE, {
    slug: entry.slug,
    path: entry.path,
    href: entry.href,
    domId: entry.domId,
    datetime: entry.date,
    title: entry.title,
    titleHtml: renderInlineMarkdown(entry.title),
    content,
    actions: renderActions(entry.link),
  });
}

function buildTilListHtml(entries) {
  return entries.map(renderTilEntryHtml).join('\n');
}

function buildStandaloneTilPage(tilDir, templatePath, placeholder) {
  const html = fs.readFileSync(templatePath, 'utf8');
  const entries = collectTilEntries(tilDir);
  const listHtml = buildTilListHtml(entries);
  return html.replace(placeholder, `\n${listHtml}\n        `);
}

function buildTilDetailPage(entry) {
  const content = entry.contentHtml
    ? `<div class="til-entry__content">${entry.contentHtml}</div>`
    : '';

  return renderTemplate(TIL_ENTRY_TEMPLATE, {
    slug: entry.slug,
    title: entry.title,
    titleHtml: renderInlineMarkdown(entry.title),
    datetime: entry.date,
    longDate: formatDate(entry.date) || entry.date,
    content,
    actions: renderActions(entry.link),
  });
}

export {
  collectTilEntries,
  buildTilListHtml,
  buildStandaloneTilPage,
  buildTilDetailPage,
};
