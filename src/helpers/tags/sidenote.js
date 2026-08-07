import Markdoc from '@markdoc/markdoc';

const { Tag } = Markdoc;

export default {
  attributes: {
    label: { type: String, required: true, matches: /^[a-z0-9-]+$/ },
  },
  validate(node) {
    if (node.children.length === 0) {
      return [
        {
          id: 'sidenote-empty',
          level: 'error',
          message: '{% sidenote %} must contain the note content',
        },
      ];
    }

    return [];
  },
  transform(node, config) {
    const children = node.transformChildren(config);
    return new Tag('aside', { class: 'sidenote', role: 'note', label: node.attributes.label }, children);
  },
};
