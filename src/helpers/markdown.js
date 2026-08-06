import Markdoc from '@markdoc/markdoc';
import matter from 'gray-matter';

import markdocConfig from './markdoc-config.js';
import { textToSlug } from './utils.js';

function parseMarkdownFrontmatter(content) {
  return matter(content);
}

function extractDateFromPath(pathStr) {
  const match = pathStr.match(/(?<year>\d{4})[\\/](?<month>\d{2})[\\/](?<day>\d{2})[\\/]/);
  if (match) {
    const { year, month, day } = match.groups;
    return [year, month, day].join('-');
  }
}

function getTextContent(node) {
  if (typeof node === 'string') return node;
  if (node && node.children) return node.children.map(getTextContent).join('');

  return '';
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

function processHtmlOutput(html) {
  const codeRegex = /(<pre[\s\S]*?<\/pre>|<code[^>]*>[\s\S]*?<\/code>)/gi;

  const parts = html.split(codeRegex);

  const processedParts = parts.map((part) => {
    if (/^<(pre|code)/i.test(part)) return part;

    const unescaped = part
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    return unescaped.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"');
  });

  return processedParts.join('');
}

function renderMarkdoc(content, config = markdocConfig) {
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, config);
  const rendered = Markdoc.renderers.html(transformed);
  return processHtmlOutput(rendered);
}

function renderMarkdocWithHeadings(content, config = markdocConfig) {
  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, config);

  const headings = collectHeadings(transformed);
  const html = processHtmlOutput(Markdoc.renderers.html(transformed));

  return { headings, html };
}

export {
  extractDateFromPath,
  parseMarkdownFrontmatter,
  processHtmlOutput,
  renderMarkdoc,
  renderMarkdocWithHeadings,
};
