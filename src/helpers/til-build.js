import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  extractDateFromPath,
  parseMarkdown,
  renderMarkdoc,
  withFrontmatterVariables,
} from './markdown.js';
import {
  buildMetaDescription,
  collapseWhitespace,
  escapeAttribute,
  escapeHtml,
  renderTemplate,
} from './utils.js';
import formatDate from './format-date.js';
import { SITE_NAME, SITE_ORIGIN, TIL_DESCRIPTION } from './site-meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const TIL_DIR = path.join(SRC_DIR, 'til');

const TIL_ENTRY_TEMPLATE_PATH = path.join(TIL_DIR, '_template.html');
const TIL_ITEM_TEMPLATE_PATH = path.join(COMPONENTS_DIR, '_til-item.html');
const TIL_ACTIONS_TEMPLATE_PATH = path.join(COMPONENTS_DIR, '_til-actions.html');

// Match `<til-root>/yyyy/mm/dd/slug.md` and capture each part.
const TIL_PATH_REGEX =
  /(?<year>\d{4})[\\/](?<month>\d{2})[\\/](?<day>\d{2})[\\/](?<slug>[^\\/]+?)\.md$/;

function readTemplate(templatePath) {
  return fs.readFileSync(templatePath, 'utf8').trim();
}

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

function unwrapArticle(html) {
  const trimmed = html.trim();
  const match = trimmed.match(/^<article>\s*([\s\S]*?)\s*<\/article>$/);
  return match ? match[1].trim() : trimmed;
}

function unwrapParagraph(html) {
  return html.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

function renderInlineMarkdown(text) {
  const { ast } = parseMarkdown(text);

  // Markdoc wraps single-line content in <article><p>…</p></article>.
  // Unwrap so the title renders inline inside an <h2> / <h1>.
  return unwrapParagraph(unwrapArticle(renderMarkdoc(ast)));
}

function processTilMarkdown(content, filePath) {
  const { ast, frontmatter } = parseMarkdown(content);
  const date = extractDateFromPath(filePath);

  const markdocConfigWithFrontmatter = withFrontmatterVariables({
    ...frontmatter,
    date,
  });

  return {
    html: unwrapArticle(renderMarkdoc(ast, markdocConfigWithFrontmatter)),
    metadata: {
      ...frontmatter,
      date,
    },
  };
}

function renderActions(link) {
  if (!link) return '';

  return renderTemplate(readTemplate(TIL_ACTIONS_TEMPLATE_PATH), { link });
}

function readTilEntry(filePath) {
  const parsed = parseTilPath(filePath);
  if (!parsed) return null;

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const { html, metadata } = processTilMarkdown(rawContent, filePath);

  return {
    slug: parsed.slug,
    path: parsed.path,
    href: parsed.href,
    domId: parsed.domId,
    date: metadata.date || parsed.date,
    sortValue: `${parsed.date}-${parsed.slug}`,
    title: metadata.title || parsed.slug,
    link: metadata.link || '',
    excerpt: collapseWhitespace(metadata.excerpt || ''),
    contentHtml: html,
    filePath,
  };
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

      const entry = readTilEntry(entryPath);
      if (entry) entries.push(entry);
    }
  }

  walk(tilDir);
  entries.sort((a, b) => b.sortValue.localeCompare(a.sortValue));
  return entries;
}

function renderTilEntryHtml(entry) {
  return renderTemplate(readTemplate(TIL_ITEM_TEMPLATE_PATH), {
    slug: entry.slug,
    path: entry.path,
    href: entry.href,
    domId: entry.domId,
    datetime: entry.date,
    title: entry.title,
    titleHtml: renderInlineMarkdown(entry.title),
    content: entry.contentHtml,
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
  const template = fs.readFileSync(TIL_ENTRY_TEMPLATE_PATH, 'utf8');
  const content = entry.contentHtml || '';
  const pageTitle = `${entry.title} • TIL • ${SITE_NAME}`;
  const metaDescription = buildMetaDescription({
    excerpt: entry.excerpt,
    html: entry.contentHtml,
    fallback: TIL_DESCRIPTION,
  });

  return renderTemplate(template, {
    pageTitle: escapeHtml(pageTitle),
    metaTitle: escapeAttribute(pageTitle),
    metaDescription: escapeAttribute(metaDescription),
    canonicalUrl: escapeAttribute(`${SITE_ORIGIN}${entry.href}`),
    titleHtml: renderInlineMarkdown(entry.title),
    datetime: entry.date,
    longDate: formatDate(entry.date) || entry.date,
    content,
    excerpt: escapeHtml(entry.excerpt || ''),
    actions: renderActions(entry.link),
    siteName: escapeAttribute(SITE_NAME),
  });
}

export {
  readTilEntry,
  collectTilEntries,
  buildTilListHtml,
  buildStandaloneTilPage,
  buildTilDetailPage,
};
