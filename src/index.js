import './style.css';
import './highlight-theme.css';
import './404.css';

import initBlogToc from './helpers/init-blog-toc.js';
import initCodeCopyButtons from './helpers/init-code-copy-buttons.js';
import initCopyLinkButton from './helpers/init-copy-link-button.js';
import initDemoLinks from './helpers/init-demo-links.js';
import initKeyPressListeners from './helpers/init-key-press-listeners.js';
import initKonamiCode from './helpers/init-konami-code.js';
import initPhotoGallery from './helpers/init-photo-gallery.js';
import initThemeTransitionGuard from './helpers/init-theme-transition-guard.js';
import initTilTimeline, { initTilContentClipping } from './helpers/init-til.js';
import markMultilineCodeBlocks from './helpers/mark-multiline-code-blocks.js';

const init = () => {
  initKonamiCode();
  initPhotoGallery();
  initThemeTransitionGuard();

  const { page } = document.body.dataset;
  if (page === 'blog-post') {
    initBlogToc();
    initCodeCopyButtons();
    initCopyLinkButton();
    initDemoLinks();
    initKeyPressListeners();
    markMultilineCodeBlocks();
  }
  if (page === 'til-index') {
    initTilTimeline();
    initTilContentClipping();
    markMultilineCodeBlocks();
  }
  if (page === 'til-entry') {
    initCodeCopyButtons();
    initKeyPressListeners();
    markMultilineCodeBlocks();
  }
};

document.addEventListener('DOMContentLoaded', () => init());
