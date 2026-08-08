import fs from 'fs';
import path from 'path';

import applyBaseLayout from './apply-base-layout.js';
import { buildBlogPostPage, processMarkdown } from './blog-build.js';
import { buildTilDetailPage, readTilEntry } from './til-build.js';

const BLOG_PREFIX = '/blog/';
const TIL_ENTRY_REGEX = /^\/til\/(?<entryPath>\d{4}\/\d{2}\/\d{2}\/[^\\/]+?)$/;

function normalizeRequestPath(requestPath) {
  const rawPath = requestPath.split(/[?#]/)[0];
  let pathname = rawPath;

  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    pathname = rawPath;
  }

  return pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
}

function resolveSourceFile(rootDir, relativePath) {
  if (!relativePath) return null;

  const rootPath = path.resolve(rootDir);
  const filePath = path.resolve(rootPath, relativePath);
  const relative = path.relative(rootPath, filePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;

  try {
    return fs.statSync(filePath).isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function tilEntryPathFromPathname(pathname) {
  return pathname.match(TIL_ENTRY_REGEX)?.groups?.entryPath || null;
}

function tilEntryPathFromRequestPath(requestPath) {
  return tilEntryPathFromPathname(normalizeRequestPath(requestPath));
}

function tilMarkdownPathFromEntryPath(tilDir, entryPath) {
  return resolveSourceFile(tilDir, entryPath && `${entryPath}.md`);
}

function blogSlugFromPathname(pathname) {
  if (!pathname.startsWith(BLOG_PREFIX)) return null;

  const slug = pathname.slice(BLOG_PREFIX.length);
  return slug && slug !== '_template' && !slug.endsWith('/_template') ? slug : null;
}

function blogSlugFromRequestPath(requestPath) {
  return blogSlugFromPathname(normalizeRequestPath(requestPath));
}

function blogMarkdownPathFromRequestPath(blogDir, requestPath) {
  const slug = blogSlugFromRequestPath(requestPath);
  return resolveSourceFile(blogDir, slug && `${slug}.md`);
}

function renderTilDetailPage(markdownPath) {
  const entry = readTilEntry(markdownPath);
  return entry && applyBaseLayout(buildTilDetailPage(entry));
}

function renderBlogPostPage(markdownPath, slug, blogTemplatePath) {
  const processed = processMarkdown(fs.readFileSync(markdownPath, 'utf8'), markdownPath);
  const template = fs.readFileSync(blogTemplatePath, 'utf8');

  return applyBaseLayout(
    buildBlogPostPage(processed.html, template, {
      ...processed.metadata,
      href: `/blog/${slug}`,
    }),
  );
}

function serveHtml(req, res, html, assetTags) {
  const pageHtml = assetTags ? html.replace('</head>', `${assetTags}</head>`) : html;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(req.method === 'HEAD' ? undefined : pageHtml);
}

function createDevMiddleware({
  blogDir,
  blogTemplatePath,
  tilDir,
  assetTags = '',
  knownBlogSlugs = new Set(),
  knownTilEntryPaths = new Set(),
}) {
  return function devMiddleware(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const pathname = normalizeRequestPath(req.url);
    const tilEntryPath = tilEntryPathFromPathname(pathname);
    const blogSlug = tilEntryPath ? null : blogSlugFromPathname(pathname);

    if (tilEntryPath && !knownTilEntryPaths.has(tilEntryPath)) {
      const markdownPath = tilMarkdownPathFromEntryPath(tilDir, tilEntryPath);
      const html = markdownPath && renderTilDetailPage(markdownPath);
      if (html) return serveHtml(req, res, html, assetTags);
    }

    if (blogSlug && !knownBlogSlugs.has(blogSlug)) {
      const markdownPath = resolveSourceFile(blogDir, `${blogSlug}.md`);
      const html = markdownPath && renderBlogPostPage(markdownPath, blogSlug, blogTemplatePath);
      if (html) return serveHtml(req, res, html, assetTags);
    }

    return next();
  };
}

export {
  blogMarkdownPathFromRequestPath,
  blogSlugFromRequestPath,
  createDevMiddleware,
  tilEntryPathFromRequestPath,
  tilMarkdownPathFromEntryPath,
};
