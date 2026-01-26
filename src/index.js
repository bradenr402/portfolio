import './style.css';
import './highlight-theme.css';

import initBlogToc from './helpers/init-blog-toc.js';
import initCodeCopyButtons from './helpers/init-code-copy-buttons.js';
import initCopyLinkButton from './helpers/init-copy-link-button.js';
import initBlogLayout from './helpers/init-blog-layout.js';
import initKeyPressListeners from './helpers/init-key-press-listeners.js';

const init = () => {
  if (document.body.dataset.page === 'blog-post') {
    initBlogToc();
    initCodeCopyButtons();
    initCopyLinkButton();
    initKeyPressListeners();
  } else if (document.body.dataset.page === 'blog-index') {
    initBlogLayout();
  }
};

document.addEventListener('DOMContentLoaded', () => init());
