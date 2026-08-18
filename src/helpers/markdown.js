import Markdoc from '@markdoc/markdoc';

import markdocConfig from './markdoc-config.js';
import { calculateReadingTime, parseMarkdown } from './parse-markdown.js';
import { escapeHtml, textToSlug } from './utils.js';

function extractDateFromPath(pathStr) {
  const match = pathStr.match(/(?<year>\d{4})[\\/](?<month>\d{2})[\\/](?<day>\d{2})[\\/]/);
  if (match) {
    const { year, month, day } = match.groups;
    return [year, month, day].join('-');
  }
  return undefined;
}

function getTagTextContent(node) {
  if (typeof node === 'string') return node;
  if (!node?.children) return '';

  return node.children.map(getTagTextContent).join('');
}

const TOC_INLINE_TAGS = new Set(['code', 'em', 'strong', 'i', 'b', 's']);

function getTagInlineHtml(node) {
  if (typeof node === 'string') return escapeHtml(node);
  if (!node?.children) return '';

  const html = node.children.map(getTagInlineHtml).join('');
  return TOC_INLINE_TAGS.has(node.name) ? `<${node.name}>${html}</${node.name}>` : html;
}

function collectHeadings(node, headings = [], usedIds = new Set()) {
  if (!node) return headings;

  if (node.name?.match(/^h[2-6]$/)) {
    const level = parseInt(node.name.substring(1), 10);
    const text = getTagTextContent(node);

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
      headings.push({ id, level, text, html: getTagInlineHtml(node) });
    }
  }

  if (node.children) {
    for (const child of node.children) collectHeadings(child, headings, usedIds);
  }

  return headings;
}

/*
 * Pair sidenote references with their sidenotes and assign shared numbers.
 * Refs are numbered in document order; each sidenote inherits the number of
 * the ref that shares its label. Both elements receive the same
 * `data-sidenote` value, which the CSS uses for numbering and hover
 * highlighting.
 */
function assignSidenoteNumbers(root) {
  const refs = [];
  const notes = [];
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    if (!Markdoc.Tag.isTag(node)) continue;

    if (node.attributes.class === 'sidenote-ref') refs.push(node);
    if (node.attributes.class === 'sidenote') notes.push(node);

    stack.push(...node.children.slice().reverse());
  }

  const numbersByLabel = new Map();

  refs.forEach((ref, index) => {
    const number = index + 1;

    ref.attributes['data-sidenote'] = number;
    numbersByLabel.set(ref.attributes.label, number);
  });

  notes.forEach((note) => {
    const number = numbersByLabel.get(note.attributes.label);

    note.attributes['data-sidenote'] = number;
    note.attributes['aria-label'] = `Sidenote ${number}`;
  });

  // Remove the `label` attribute from refs and notes
  [...refs, ...notes].forEach(({ attributes }) => delete attributes.label);
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

// Collect every `label` used by {% tagName %} tags, mapped to the lines where each one appears.
function findLabels(ast, tagName) {
  const labels = new Map();

  for (const node of ast.walk()) {
    if (node.tag !== tagName) continue;

    const { label } = node.attributes;
    const lines = labels.get(label) ?? [];

    lines.push(node.lines);
    labels.set(label, lines);
  }

  return labels;
}

/*
 * Sidenote pairing can only be checked document-wide: every label must appear
 * on exactly one {% sidenote-ref %} and exactly one {% sidenote %}.
 */
function validateSidenotePairs(ast) {
  const refs = findLabels(ast, 'sidenote-ref');
  const notes = findLabels(ast, 'sidenote');

  const errors = [];
  const report = (lines, message) => {
    errors.push({ lines, error: { id: 'sidenote-pairing', level: 'error', message } });
  };

  for (const [label, lines] of refs) {
    if (lines.length > 1) report(lines[1], `Duplicate {% sidenote-ref %} label '${label}'`);

    if (!notes.has(label)) {
      report(lines[0], `{% sidenote-ref %} label '${label}' has no matching {% sidenote %}`);
    }
  }

  for (const [label, lines] of notes) {
    if (lines.length > 1) report(lines[1], `Duplicate {% sidenote %} label '${label}'`);

    if (!refs.has(label)) {
      report(lines[0], `{% sidenote %} label '${label}' has no matching {% sidenote-ref %}`);
    }
  }

  return errors;
}

function validateMarkdoc(ast, config) {
  const errors = [...Markdoc.validate(ast, config), ...validateSidenotePairs(ast)];
  if (!errors.length) return;

  const messages = errors.map(({ error, lines }) => {
    return `  [${error.level}] ${error.message} (line ${lines[0] + 1})`;
  });

  throw new Error(`Invalid Markdoc content:\n${messages.join('\n')}`);
}

function transformMarkdoc(ast, config = markdocConfig) {
  validateMarkdoc(ast, config);

  const transformed = Markdoc.transform(ast, config);
  assignSidenoteNumbers(transformed);

  return transformed;
}

function renderMarkdoc(ast, config = markdocConfig) {
  const transformed = transformMarkdoc(ast, config);

  const rendered = Markdoc.renderers.html(transformed);
  const html = processHtmlOutput(rendered);

  return html;
}

function renderMarkdocWithHeadings(ast, config = markdocConfig) {
  const transformed = transformMarkdoc(ast, config);
  const headings = collectHeadings(transformed);

  const rendered = Markdoc.renderers.html(transformed);
  const html = processHtmlOutput(rendered);

  return { headings, html };
}

// Markdoc wraps rendered documents in <article>; strip it for embedded output
function unwrapArticle(html) {
  const trimmed = html.trim();
  const match = trimmed.match(/^<article>\s*([\s\S]*?)\s*<\/article>$/);

  return match ? match[1].trim() : trimmed;
}

function unwrapParagraph(html) {
  return html.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

// Render a string as inline Markdown for use inside an existing element.
// Multi-paragraph input is collapsed into one line.
function renderInlineMarkdown(text) {
  const { ast } = parseMarkdown(String(text));

  return unwrapArticle(renderMarkdoc(ast))
    .split(/<\/p>\s*<p>/)
    .map(unwrapParagraph)
    .join(' ');
}

// Full Markdown (paragraphs, lists, code blocks), without the <article> wrapper
function renderFullMarkdown(text, config = markdocConfig) {
  const { ast } = parseMarkdown(String(text));

  return unwrapArticle(renderMarkdoc(ast, config));
}

function withFrontmatterVariables(frontmatter) {
  return {
    ...markdocConfig,
    variables: { ...markdocConfig.variables, frontmatter },
  };
}

export {
  calculateReadingTime,
  extractDateFromPath,
  parseMarkdown,
  processHtmlOutput,
  renderFullMarkdown,
  renderInlineMarkdown,
  renderMarkdoc,
  renderMarkdocWithHeadings,
  unwrapArticle,
  withFrontmatterVariables,
};
