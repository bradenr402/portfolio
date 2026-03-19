import Markdoc from '@markdoc/markdoc';
const { Tag } = Markdoc;
import { blogCard } from './tags/blog-card.js';

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
    link: {
      render: 'a',
      attributes: {
        href: { type: String },
        title: { type: String },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);

        const href = attributes.href || '';

        const isNewTab = href.startsWith('newtab:');
        const isSameTab = href.startsWith('sametab:');
        const isExternal = href.startsWith('http');

        if (isNewTab || (!isSameTab && isExternal)) {
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
        }

        attributes.href = href.replace(/^(new|same)tab:/, '');

        return new Tag('a', attributes, children);
      },
    },
    // Custom table node to wrap tables in a div container for responsive styling
    table: {
      render: 'table',
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag('div', { class: 'table-wrapper' }, [new Tag('table', attributes, children)]);
      },
    },
    // Custom list item node to wrap content in a div for better styling
    item: {
      render: 'li',
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag('li', attributes, [new Tag('div', {}, children)]);
      },
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
    'blog-card': blogCard,
  },
};
