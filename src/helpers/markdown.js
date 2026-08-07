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
  return undefined;
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
      let { id } = node.attributes;
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

function validateMarkdoc(ast, config) {
  const errors = Markdoc.validate(ast, config);
  if (!errors.length) return;

  const messages = errors.map(({ error, lines }) => {
    return `  [${error.level}] ${error.message} (line ${lines[0] + 1})`;
  });

  throw new Error(`Invalid Markdoc content:\n${messages.join('\n')}`);
}

function transformMarkdoc(content, config = markdocConfig) {
  const ast = Markdoc.parse(content);
  validateMarkdoc(ast, config);

  const transformed = Markdoc.transform(ast, config);
  assignSidenoteNumbers(transformed);

  return transformed;
}

function renderMarkdoc(content, config = markdocConfig) {
  const transformed = transformMarkdoc(content, config);

  const rendered = Markdoc.renderers.html(transformed);
  const html = processHtmlOutput(rendered);

  return html;
}

function renderMarkdocWithHeadings(content, config = markdocConfig) {
  const transformed = transformMarkdoc(content, config);
  const headings = collectHeadings(transformed);

  const rendered = Markdoc.renderers.html(transformed);
  const html = processHtmlOutput(rendered);

  return { headings, html };
}

export {
  extractDateFromPath,
  parseMarkdownFrontmatter,
  processHtmlOutput,
  renderMarkdoc,
  renderMarkdocWithHeadings,
};
