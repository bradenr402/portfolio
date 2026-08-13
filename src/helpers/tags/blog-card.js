import Markdoc from '@markdoc/markdoc';
import { fileURLToPath } from 'url';

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import formatDate from '../format-date.js';
import { calculateReadingTime, parseMarkdown } from '../parse-markdown.js';
import { renderTemplate } from '../utils.js';

const { Tag } = Markdoc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_ROOT = path.resolve(__dirname, '../../blog');
const BLOG_CARD_TEMPLATE_PATH = path.resolve(__dirname, '../../components/_blog-card.html');

function domNodeToTag(node) {
  if (node.nodeType === 3) {
    return node.textContent;
  }
  if (node.nodeType === 1) {
    const tagName = node.tagName.toLowerCase();
    const attributes = {};
    for (let i = 0; i < node.attributes.length; i += 1) {
      const attr = node.attributes[i];
      attributes[attr.name] = attr.value;
    }
    const children = [];
    node.childNodes.forEach((child) => {
      const res = domNodeToTag(child);
      if (res !== null) children.push(res);
    });
    return new Tag(tagName, attributes, children);
  }
  return null;
}

function blogCardPath(src) {
  const srcWithoutSlashes = src.replace(/^\/+|\/+$/g, '');
  const filePath = path.resolve(BLOG_ROOT, `${srcWithoutSlashes}.md`);
  const relativePath = path.relative(BLOG_ROOT, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`blog-card src '${src}' resolves outside the blog directory`);
  }

  const slug = relativePath.replace(/\.md$/, '').split(path.sep).join('/');

  return { slug, filePath };
}

class BlogCardSrc {
  validate(value) {
    try {
      const { filePath } = blogCardPath(value);

      if (!fs.existsSync(filePath)) {
        return [
          {
            id: 'blog-card-src-missing',
            level: 'error',
            message: `No blog post found for src '${value}' (expected ${filePath})`,
          },
        ];
      }
    } catch (e) {
      return [{ id: 'blog-card-src-invalid', level: 'error', message: e.message }];
    }

    return [];
  }
}

export default {
  attributes: { src: { type: BlogCardSrc, required: true } },
  transform(node) {
    const { src } = node.attributes;

    try {
      const { slug, filePath } = blogCardPath(src);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { ast, frontmatter } = parseMarkdown(fileContent);

      const readingTime = calculateReadingTime(ast);

      const match = slug.match(/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\//);
      let dateStr = '';
      if (match) {
        const { year, month, day } = match.groups;
        dateStr = [year, month, day].join('-');
      }

      const datetime = dateStr;
      const displayDate = formatDate(dateStr);

      const title = frontmatter.title || path.basename(slug);
      let image = frontmatter.image?.src;
      const alt = frontmatter.image?.alt || '';

      if (image && !/^https?:\/\//.test(image) && !image.startsWith('/')) {
        const cardDir = path.dirname(slug);
        image = `/blog/${cardDir}/${image}`;
      }

      const tags = frontmatter.tags || [];
      const tagsHtml = tags.length > 0 ? tags.map((tag) => `<span class="blog-post__tag">${tag}</span>`).join('') : '';

      const template = fs.readFileSync(BLOG_CARD_TEMPLATE_PATH, 'utf8');

      const renderedHtml = renderTemplate(template, {
        href: `/blog/${slug}`,
        title,
        datetime,
        displayDate,
        readingTime,
        image: image || '',
        alt,
        tags: tagsHtml,
      });

      const fragment = JSDOM.fragment(renderedHtml);

      if (!image) fragment.querySelector('.blog-card__thumb')?.remove();

      const outputTags = [];

      fragment.childNodes.forEach((child) => {
        const tag = domNodeToTag(child);
        if (tag) outputTags.push(tag);
      });

      return outputTags;
    } catch (e) {
      throw new Error(`Failed to render blog-card '${src}'`, { cause: e });
    }
  },
};
