import Markdoc from '@markdoc/markdoc';
import { fileURLToPath } from 'url';

const { Tag } = Markdoc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { JSDOM } from 'jsdom';
import { renderTemplate } from '../utils.js';

function domNodeToTag(node) {
  if (node.nodeType === 3) {
    return node.textContent;
  }
  if (node.nodeType === 1) {
    const tagName = node.tagName.toLowerCase();
    const attributes = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      attributes[attr.name] = attr.value;
    }
    const children = [];
    node.childNodes.forEach(child => {
      const res = domNodeToTag(child);
      if (res !== null) children.push(res);
    });
    return new Tag(tagName, attributes, children);
  }
  return null;
}

function getReadingTime(content) {
  const wordCount = content.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / 250);
  return `${readingTimeMinutes} min read`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }
  } catch (e) {
    return dateStr;
  }
  return dateStr;
}


export const blogCard = {
  attributes: { src: { type: String, required: true } },
  transform(node, config) {
    const src = node.attributes.src;
    if (!src) return [];

    const blogDir = path.resolve(__dirname, '../blog');
    const normalizedSrc = src.replace(/^\/+|\/+$/g, '');
    const filePath = path.join(blogDir, `${normalizedSrc}.md`);

    if (!fs.existsSync(filePath)) {
      const href = `/blog/${normalizedSrc}`;
      return new Tag('p', {}, [new Tag('a', { href }, [href])]);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content: markdownBody } = matter(fileContent);

      const readingTime = getReadingTime(markdownBody);

      const match = normalizedSrc.match(/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\//);
      let dateStr = '';
      if (match) {
        const { year, month, day } = match.groups;
        dateStr = [year, month, day].join('-');
      }

      const datetime = dateStr;
      const displayDate = formatDate(dateStr);

      const title = frontmatter.title || path.basename(normalizedSrc);
      let image = frontmatter.image?.src;
      const alt = frontmatter.image?.alt || '';

      if (image && !image.startsWith('http') && !image.startsWith('/')) {
        const cardDir = path.dirname(normalizedSrc);
        image = `/blog/${cardDir}/${image}`;
      }

      let tags = frontmatter.tags || [];
      const tagsHtml = tags.length > 0
        ? `<div class="blog-post-card__tags">
          ${tags.map(t => `<span class="blog-post-card__tag">${t}</span>`).join('')}
        </div>`
        : '';

      let template = fs.readFileSync(path.resolve(__dirname, '../components/_blog-post-card.html'), 'utf8');

      const renderedHtml = renderTemplate(template, {
        href: `/blog/${normalizedSrc}`,
        title,
        datetime,
        displayDate,
        readingTime,
        image: image || '',
        alt,
        tags: tagsHtml
      });

      const fragment = JSDOM.fragment(renderedHtml);

      if (!image) fragment.querySelector('.blog-post-card__thumb')?.remove();

      const outputTags = [];

      fragment.childNodes.forEach(node => {
        const tag = domNodeToTag(node);
        if (tag) outputTags.push(tag);
      });

      return outputTags;

    } catch (e) {
      console.error('Error in blog-card transform:', e);
      return [];
    }
  }
};