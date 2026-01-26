import Markdoc from '@markdoc/markdoc';
const { Tag } = Markdoc;
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';
import { renderTemplate } from './utils.js';
import formatDate from './format-date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default {
  nodes: {
    // Custom heading node to support data-toc-skip attribute
    heading: {
      children: ['inline'],
      attributes: {
        'data-toc-skip': { type: Boolean },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag(`h${node.attributes.level}`, attributes, children);
      },
    },
    // Custom link node to automatically open external links in a new tab
    // Supports 'newtab:' and 'sametab:' prefixes for override behavior
    link: {
      render: 'a',
      attributes: {
        href: { type: String },
        title: { type: String },
        target: { type: String },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);

        if (attributes.href?.startsWith('newtab:')) {
          attributes.href = attributes.href.replace(/^newtab:/, '');
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
        } else if (attributes.href.startsWith('sametab:')) {
          attributes.href = attributes.href.replace(/^sametab:/, '');
        } else if (attributes.href.startsWith('http')) {
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
        }

        return new Tag('a', attributes, children);
      }
    },
    // Custom table node to wrap tables in a div container for responsive styling
    table: {
      render: 'table',
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag('div', { class: 'table-wrapper' }, [
          new Tag('table', attributes, children)
        ]);
      }
    },
    item: {
      render: 'li',
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag('li', attributes, [
          new Tag('div', {}, children)
        ]);
      }
    },
    // Custom code fence node to add language class for syntax highlighting
    fence: {
      render: 'pre',
      attributes: {
        language: { type: String },
        content: { type: String },
      },
      transform(node, config) {
        if (node.attributes.language === 'html_raw') {
          return node.attributes.content;
        }

        return new Tag('pre', {}, [
          new Tag('code', { class: `language-${node.attributes.language}` }, [
            node.attributes.content,
          ]),
        ]);
      },
    },
  },
  tags: {
    'blog-card': {
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
      }
    },
  },
};
