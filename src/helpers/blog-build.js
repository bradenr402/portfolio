import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

import {
  calculateReadingTime,
  extractDateFromPath,
  parseMarkdown,
  renderMarkdoc,
  renderMarkdocWithHeadings,
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
import {
  BLOG_DESCRIPTION,
  SITE_IMAGE_URL,
  SITE_NAME,
  SITE_ORIGIN,
} from './site-meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const BLOG_ROOT = path.join(SRC_DIR, 'blog');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

const BLOG_TOC_ITEM_TEMPLATE_PATH    = path.join(COMPONENTS_DIR, '_blog-toc-item.html');
const BLOG_LIST_ITEM_TEMPLATE_PATH   = path.join(COMPONENTS_DIR, '_blog-list-item.html');
const BLOG_ACTIONS_TEMPLATE_PATH     = path.join(COMPONENTS_DIR, '_blog-actions.html');
const BLOG_UPDATES_TEMPLATE_PATH     = path.join(COMPONENTS_DIR, '_blog-updates.html');
const BLOG_UPDATE_ITEM_TEMPLATE_PATH = path.join(COMPONENTS_DIR, '_blog-update-item.html');

function readTemplate(templatePath) {
  return fs.readFileSync(templatePath, 'utf8').trim();
}

function renderTagsHtml(tags) {
  if (!tags || tags.length === 0) return '';

  return tags.map((tag) => `<span class="blog-post__tag">${tag}</span>`).join('');
}

function resolveBlogImage(src, contextPath) {
  if (!src) return '';

  // If absolute URL or root-relative, return as is
  if (src.startsWith('/') || /^https?:\/\//.test(src)) return src;

  const dir = path.dirname(contextPath);
  const relativeDir = path.relative(BLOG_ROOT, dir);
  const relativePathUrl = relativeDir.split(path.sep).join('/');

  return `/blog/${relativePathUrl}/${src}`;
}

function processMarkdown(content, filepath) {
  const { ast, frontmatter } = parseMarkdown(content);

  const alt = frontmatter.image?.alt;
  let image = frontmatter.image?.src;

  if (image) {
    image = resolveBlogImage(image, filepath);
  }

  const date = extractDateFromPath(filepath);
  const readingTime = calculateReadingTime(ast);

  // Inject frontmatter as variables for use within blog posts
  const markdocConfigWithFrontmatter = withFrontmatterVariables({
    ...frontmatter,
    readingTime,
    date,
  });

  const { headings, html } = renderMarkdocWithHeadings(ast, markdocConfigWithFrontmatter);

  return {
    html,
    metadata: {
      ...frontmatter,
      image,
      alt,
      date,
      readingTime,
      headings,
    },
  };
}

function normalizePostMetadata(slug, metadata = {}) {
  const title = metadata.title || slug;
  const image = metadata.image || '';
  const alt = metadata.alt || '';
  const readingTime = metadata.readingTime || '';
  const datetime = metadata.date || '';
  const displayDate = formatDate(datetime) || datetime;
  const tags = metadata.tags || [];
  const updates = metadata.updates || [];
  const excerpt = collapseWhitespace(metadata.excerpt || '');

  return {
    title,
    displayDate,
    datetime,
    image,
    alt,
    readingTime,
    tags,
    updates,
    excerpt,
  };
}

function collectBlogPostsMeta(blogDir) {
  const posts = [];

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (!(entry.isFile() && entry.name.endsWith('.md'))) continue;

      const relativePath = path.relative(blogDir, entryPath);
      const slug = relativePath.replace(/\.md$/, '').split(path.sep).join('/');

      const rawContent = fs.readFileSync(entryPath, 'utf8');

      // Efficiently process markdown to get metadata
      const { metadata } = processMarkdown(rawContent, entryPath);
      const meta = normalizePostMetadata(slug, metadata);

      posts.push({
        slug,
        href: `/blog/${slug}`,
        sortValue: slug,
        filePath: entryPath,
        ...meta,
      });
    }
  }

  walk(blogDir);
  posts.sort((a, b) => b.sortValue.localeCompare(a.sortValue));
  return posts;
}

function buildBlogTocListHtml(headings) {
  if (!headings || headings.length < 3) return '';

  const template = readTemplate(BLOG_TOC_ITEM_TEMPLATE_PATH);

  return headings
    .map((h) =>
      renderTemplate(template, {
        level: h.level,
        id: escapeAttribute(h.id),
        text: escapeHtml(h.text),
      }))
    .join('\n');
}

function normalizeDate(value) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
}

function buildUpdatesHtml(updates) {
  if (!updates || updates.length === 0) return '';

  const updatesTemplate = readTemplate(BLOG_UPDATES_TEMPLATE_PATH);
  const updateItemTemplate = readTemplate(BLOG_UPDATE_ITEM_TEMPLATE_PATH);

  // Sort by newest date first
  const sorted = [...updates].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

  const items = sorted
    .map((update) => {
      const datetime = normalizeDate(update.date);
      const displayDate = formatDate(datetime) || datetime;
      const { ast } = parseMarkdown(update.description);
      const description = renderMarkdoc(ast);

      return renderTemplate(updateItemTemplate, {
        datetime,
        displayDate,
        description,
      });
    })
    .join('\n');

  return renderTemplate(updatesTemplate, { items });
}

function getLatestUpdateDate(updates) {
  if (!updates || updates.length === 0) return null;

  const sorted = [...updates].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)));
  return normalizeDate(sorted[0].date);
}

function buildBlogPostPage(partial, template, metadata = null) {
  const { title, datetime, displayDate, image, alt, readingTime, tags, updates, excerpt } =
    normalizePostMetadata('', metadata);

  // Headings come from metadata (from processMarkdown)
  const headings = metadata?.headings || [];
  const tagsHtml = renderTagsHtml(tags);
  const actionsHtml = metadata?.skip_actions ? '' : readTemplate(BLOG_ACTIONS_TEMPLATE_PATH);
  const updatesHtml = buildUpdatesHtml(updates);

  const latestUpdateDate = getLatestUpdateDate(updates);
  const updatedDateHtml = latestUpdateDate
    ? formatDate(latestUpdateDate)
    : '';

  const tocHtml = buildBlogTocListHtml(headings);
  const pageTitle = `${title || ''} • ${SITE_NAME}`;
  const metaDescription = buildMetaDescription({
    excerpt,
    html: partial,
    fallback: BLOG_DESCRIPTION,
  });
  const metaImage = image
    ? `${SITE_ORIGIN}${image}`
    : SITE_IMAGE_URL;
  const canonicalUrl = metadata?.href
    ? `${SITE_ORIGIN}${metadata.href}`
    : `${SITE_ORIGIN}/blog`;

  const data = {
    headingTitle: escapeHtml(title || ''),
    pageTitle: escapeHtml(pageTitle),
    metaTitle: escapeAttribute(pageTitle),
    metaDescription: escapeAttribute(metaDescription),
    canonicalUrl: escapeAttribute(canonicalUrl),
    displayDate: displayDate || '',
    datetime: datetime || '',
    updatedDatetime: latestUpdateDate || '',
    updatedDate: updatedDateHtml,
    headerImage: image
      ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(alt || '')}" fetchpriority="high" />`
      : '',
    readingTime: readingTime || '',
    tags: tagsHtml,
    actions: actionsHtml,
    updates: updatesHtml,
    content: partial,
    excerpt: escapeHtml(excerpt),
    toc: tocHtml,
    metaImage: escapeAttribute(metaImage),
    siteName: escapeAttribute(SITE_NAME),
  };

  const templateWithData = renderTemplate(template, data);
  const needsDomRemoval = !tocHtml || !latestUpdateDate || !tagsHtml;

  if (needsDomRemoval) {
    const dom = new JSDOM(templateWithData);
    const doc = dom.window.document;

    if (!tocHtml) {
      const aside = doc.querySelector('aside.blog-layout__aside');
      if (aside) aside.remove();
    }

    if (!latestUpdateDate) {
      const updated = doc.querySelector('time.blog-header__updated');
      if (updated) updated.remove();
    }

    if (!tagsHtml) {
      const tagsContainer = doc.querySelector('.blog-post__tags');
      if (tagsContainer) tagsContainer.remove();
    }

    return dom.serialize();
  }

  return templateWithData;
}

function renderBlogPostItemHtml(post) {
  const template = readTemplate(BLOG_LIST_ITEM_TEMPLATE_PATH);
  return renderTemplate(template, { ...post });
}

function buildBlogIndexListHtml(posts) {
  const dom = new JSDOM('');
  const doc = dom.window.document;
  const container = doc.createElement('div');

  posts.forEach((post) => {
    const li = doc.createElement('li');
    li.className = 'blog-list-item';
    li.innerHTML = renderBlogPostItemHtml(post);
    container.appendChild(li);
  });

  return container.innerHTML;
}

const RECENT_POSTS_PLACEHOLDER = '{{recentPosts}}';
const DEFAULT_RECENT_POSTS_COUNT = 5;

function injectRecentPosts(html, posts, count = DEFAULT_RECENT_POSTS_COUNT) {
  const listHtml = buildBlogIndexListHtml(posts.slice(0, count));
  return html.replace(RECENT_POSTS_PLACEHOLDER, listHtml);
}

function buildStandaloneBlogIndexPage(blogDir, indexTemplatePath, indexPlaceholder) {
  const html = fs.readFileSync(indexTemplatePath, 'utf8');

  const posts = collectBlogPostsMeta(blogDir);
  const listHtml = buildBlogIndexListHtml(posts);

  return html.replace(indexPlaceholder, `\n${listHtml}\n            `);
}

export {
  collectBlogPostsMeta,
  buildBlogTocListHtml,
  buildBlogPostPage,
  buildBlogIndexListHtml,
  buildStandaloneBlogIndexPage,
  injectRecentPosts,
  processMarkdown,
};
