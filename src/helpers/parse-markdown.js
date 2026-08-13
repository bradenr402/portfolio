import Markdoc from '@markdoc/markdoc';
import yaml from 'js-yaml';

function parseFrontmatter(rawFrontmatter) {
  if (!rawFrontmatter) return {};

  const frontmatter = yaml.load(rawFrontmatter) ?? {};

  if (typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error('Frontmatter must be a YAML mapping');
  }

  return frontmatter;
}

function parseMarkdown(content) {
  const ast = Markdoc.parse(content);
  const frontmatter = parseFrontmatter(ast.attributes.frontmatter);

  return { ast, frontmatter };
}

const WORDS_PER_MINUTE = 250;

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function calculateReadingTime(ast) {
  let words = 0;

  for (const node of ast.walk()) {
    const content = node.attributes?.content;
    if (typeof content !== 'string') continue;
    if (!(node.type === 'text' || node.type === 'code')) continue;

    words += countWords(content);
  }

  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export { calculateReadingTime, parseMarkdown };
