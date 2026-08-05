import './style.css';
import './highlight-theme.css';
import './404.css';

import initBlogToc from './helpers/init-blog-toc.js';
import initCodeCopyButtons from './helpers/init-code-copy-buttons.js';
import initCopyLinkButton from './helpers/init-copy-link-button.js';
import initKeyPressListeners from './helpers/init-key-press-listeners.js';
import initKonamiCode from './helpers/init-konami-code.js';
import initPhotoGallery from './helpers/init-photo-gallery.js';
import initTilTimeline, { initTilContentClipping } from './helpers/init-til.js';

const init = () => {
  initKonamiCode();
  initPhotoGallery();

  const page = document.body.dataset.page;
  if (page === 'blog-post') {
    initBlogToc();
    initCodeCopyButtons();
    initCopyLinkButton();
    initKeyPressListeners();
  }
  if (page === 'til-index') {
    initTilTimeline();
    initTilContentClipping();
  }
  if (page === 'til-entry') {
    initCodeCopyButtons();
    initKeyPressListeners();
    document.querySelectorAll('pre > code.language-sh, pre > code.language-bash, pre > code.language-zsh')
      .forEach((el) => {
        const isSingleLine = el.textContent.trim().split('\n').length === 1;
        if (!isSingleLine) el.classList.add('multi-line');
      });
  }
};

document.addEventListener('DOMContentLoaded', () => init());
