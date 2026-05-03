import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import Markdoc from '@markdoc/markdoc';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import markdocConfig from './markdoc-config.js';

import { renderTemplate, textToSlug } from './utils.js';
import formatDate from './format-date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const BLOG_ROOT = path.join(SRC_DIR, 'blog');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

function readLocalTemplate(name) {
  return fs.readFileSync(path.join(COMPONENTS_DIR, name), 'utf8').trim();
}

const BLOG_TOC_ITEM_TEMPLATE = readLocalTemplate('_blog-toc-item.html');
const BLOG_POST_CARD_TEMPLATE = readLocalTemplate('_blog-post-card.html');
const BLOG_POST_ITEM_TEMPLATE = readLocalTemplate('_blog-post-item.html');
const BLOG_ACTIONS_TEMPLATE = readLocalTemplate('_blog-actions.html');
const BLOG_UPDATES_TEMPLATE = readLocalTemplate('_blog-updates.html');
const BLOG_UPDATE_ITEM_TEMPLATE = readLocalTemplate('_blog-update-item.html');

const WORDS_PER_MINUTE = 250;

function getTextContent(node) {
  if (typeof node === 'string') return node;
  if (node && node.children) return node.children.map(getTextContent).join('');

  return '';
}

function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  return `${minutes} min read`;
}

function extractDateFromPath(pathStr) {
  const match = pathStr.match(/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\//);
  if (match) {
    const { year, month, day } = match.groups;
    return [year, month, day].join('-');
  }
}

function renderMarkdoc(content, config) {
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, config);
  const rendered = Markdoc.renderers.html(transformed);
  return processHtmlOutput(rendered);
}

function renderMarkdocWithHeadings(content, config) {
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, config);

  const headings = collectHeadings(transformed);
  const html = processHtmlOutput(Markdoc.renderers.html(transformed));

  return { headings, html };
}

function renderTagsHtml(tags) {
  if (!tags || tags.length === 0) return '';

  return tags.map((tag) => `<span class="blog-post__tag">${tag}</span>`).join('');
}

function resolveBlogImage(src, contextPath) {
  if (!src) return '';

  // If absolute URL or root-relative, return as is
  if (src.startsWith('/') || src.match(/^https?:\/\//)) return src;

  const dir = path.dirname(contextPath);
  const relativeDir = path.relative(BLOG_ROOT, dir);
  const relativePathUrl = relativeDir.split(path.sep).join('/');

  return `/blog/${relativePathUrl}/${src}`;
}

function collectHeadings(node, headings = [], usedIds = new Set()) {
  if (!node) return headings;

  if (node.name?.match(/h[2-6]/)) {
    const level = parseInt(node.name.substring(1), 10);
    const text = getTextContent(node);

    if (!node.attributes['data-toc-skip']) {
      let id = node.attributes.id;
      if (!id) {
        const base = textToSlug(text);
        let candidate = base;
        let counter = 2;

        while (usedIds.has(candidate)) {
          candidate = `${base}-${counter}`;
          counter += 1;
        }

        id = candidate;
        node.attributes.id = id;
      }

      usedIds.add(id);
      headings.push({ id, level, text });
    }
  }

  if (node.children) {
    for (const child of node.children) collectHeadings(child, headings, usedIds);
  }

  return headings;
}

// Post-process HTML to allow raw HTML blocks in markdown files
function processHtmlOutput(html) {
  // Use regex to find code blocks and avoid modifying them
  const codeRegex = /(<pre[\s\S]*?<\/pre>|<code[^>]*>[\s\S]*?<\/code>)/gi;

  const parts = html.split(codeRegex);

  const processedParts = parts.map((part) => {
    if (/^<(pre|code)/i.test(part)) return part;

    const unescaped = part
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    return unescaped;
  });

  return processedParts.join('');
}

function processMarkdown(content, filepath) {
  const { data: frontmatter, content: markdownBody } = matter(content);

  const alt = frontmatter.image?.alt;
  let image = frontmatter.image?.src;

  if (image) {
    image = resolveBlogImage(image, filepath);
  }

  const date = extractDateFromPath(filepath);
  const readingTime = calculateReadingTime(markdownBody);

  // Inject frontmatter as variables for use within blog posts
  const markdocConfigWithFrontmatter = {
    variables: {
      frontmatter: { ...frontmatter, readingTime, date },
    },
    ...markdocConfig,
  };

  const { headings, html } = renderMarkdocWithHeadings(markdownBody, markdocConfigWithFrontmatter);

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

  return {
    title,
    displayDate,
    datetime,
    image,
    alt,
    readingTime,
    tags,
    updates,
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

      let rawContent = fs.readFileSync(entryPath, 'utf8');

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

  return headings
    .map((h) =>
      renderTemplate(BLOG_TOC_ITEM_TEMPLATE, {
        level: h.level,
        id: h.id,
        text: h.text,
      }),
    )
    .join('\n');
}

function normalizeDate(value) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
}

function buildUpdatesHtml(updates) {
  if (!updates || updates.length === 0) return '';

  // Sort by newest date first
  const sorted = [...updates].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );


  const items = sorted
    .map((update) => {
      const datetime = normalizeDate(update.date);
      const displayDate = formatDate(datetime) || datetime;
      const description = renderMarkdoc(update.description, markdocConfig);

      return renderTemplate(BLOG_UPDATE_ITEM_TEMPLATE, {
        datetime,
        displayDate,
        description,
      });
    })
    .join('\n');

  return renderTemplate(BLOG_UPDATES_TEMPLATE, { items });
}

function getLatestUpdateDate(updates) {
  if (!updates || updates.length === 0) return null;

  const sorted = [...updates].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
  return normalizeDate(sorted[0].date);
}

function buildBlogPostPage(partial, template, metadata = null) {
  const { title, datetime, displayDate, image, alt, readingTime, tags, updates } =
    normalizePostMetadata('', metadata);

  // Headings come from metadata (from processMarkdown)
  const headings = metadata?.headings || [];
  const tagsHtml = renderTagsHtml(tags);
  const actionsHtml = metadata?.skip_actions ? '' : BLOG_ACTIONS_TEMPLATE;
  const updatesHtml = buildUpdatesHtml(updates);

  const latestUpdateDate = getLatestUpdateDate(updates);
  const updatedDateHtml = latestUpdateDate
    ? formatDate(latestUpdateDate)
    : '';

  const tocHtml = buildBlogTocListHtml(headings);

  const data = {
    title: title || '',
    displayDate: displayDate || '',
    datetime: datetime || '',
    updatedDatetime: latestUpdateDate || '',
    updatedDate: updatedDateHtml,
    headerImage: image ? `<img src="${image}" alt="${alt || ''}" />` : '',
    readingTime: readingTime || '',
    tags: tagsHtml,
    actions: actionsHtml,
    updates: updatesHtml,
    content: partial,
    toc: tocHtml,
    metaImage: image
      ? `https://bradenroth.com${image}`
      : 'https://bradenroth.com/images/family.webp',
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

function renderBlogPostCardHtml(post) {
  const tagsHtml = renderTagsHtml(post.tags);

  const html = renderTemplate(BLOG_POST_CARD_TEMPLATE, {
    href: post.href,
    slug: post.slug ? `post-${post.slug.replace(/\//g, '-')}` : '',
    title: post.title,
    datetime: post.datetime,
    displayDate: post.displayDate,
    readingTime: post.readingTime,
    image: post.image || '',
    alt: post.alt || '',
    tags: tagsHtml,
  });

  if (!post.image) {
    const dom = new JSDOM(html);
    const thumb = dom.window.document.querySelector('.blog-post-card__thumb');
    if (thumb) thumb.remove();
    return dom.serialize();
  }

  return html;
}

function renderBlogPostItemHtml(post) {
  return renderTemplate(BLOG_POST_ITEM_TEMPLATE, { ...post });
}

function buildBlogIndexListHtml(posts) {
  const dom = new JSDOM('');
  const doc = dom.window.document;
  const container = doc.createElement('div');

  posts.forEach((post) => {
    const li = doc.createElement('li');
    li.className = 'blog-post-item';
    li.innerHTML = renderBlogPostItemHtml(post);
    container.appendChild(li);
  });

  return container.innerHTML;
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
  processMarkdown,
};
