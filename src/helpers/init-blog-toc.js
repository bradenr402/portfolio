const VIEWPORT_LINE_RATIO = 0.25;

// Distance from the top of the page within which the rail always stays out
const PEEK_WAKE_NEAR_TOP = 80;

// Ignore scroll jitter smaller than this before changing the rail's state
const PEEK_DELTA_THRESHOLD = 3;

// Below this the rail overlays the text instead of sitting beside it; matches blog-toc.css
const OVERLAY_LAYOUT = '(width < 48rem)';

function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function moveMarker(item, marker) {
  if (!marker || !item) return;
  const nav = marker.parentElement;
  if (!nav) return;
  const navRect = nav.getBoundingClientRect();

  // The panel is display:none while collapsed, so nothing can be measured yet
  if (!navRect.height) return;

  const itemRect = item.getBoundingClientRect();
  const offset = 2;
  marker.style.top = `${itemRect.top - navRect.top + nav.scrollTop + offset}px`;
  marker.style.height = `${itemRect.height - offset * 2}px`;
}

function setActive(id, linkById, activeState, marker, railById) {
  if (!id || !linkById.has(id)) return;
  if (activeState.value === id) return;

  if (activeState.value && linkById.has(activeState.value)) {
    const prevLink = linkById.get(activeState.value);
    const prevItem = prevLink && prevLink.parentElement;
    if (prevItem) prevItem.classList.remove('blog-toc__item--active');

    const prevRail = railById.get(activeState.value);
    if (prevRail) prevRail.classList.remove('blog-toc-rail__dash--active');
  }

  const link = linkById.get(id);
  const item = link && link.parentElement;
  if (item) {
    item.classList.add('blog-toc__item--active');
    if (marker) moveMarker(item, marker);
  }

  const railDash = railById.get(id);
  if (railDash) railDash.classList.add('blog-toc-rail__dash--active');

  activeState.value = id;
}

function updateActiveFromScroll(headings, linkById, activeState, marker, railById) {
  if (!headings.length) return;

  const viewportHeight = getViewportHeight();
  if (!viewportHeight) return;

  const lineY = viewportHeight * VIEWPORT_LINE_RATIO;
  let currentId = null;

  for (let i = 0; i < headings.length; i += 1) {
    const heading = headings[i];
    const rect = heading.getBoundingClientRect();

    if (rect.top <= lineY) {
      currentId = heading.id;
    } else {
      break;
    }
  }

  if (!currentId && headings[0]) currentId = headings[0].id;
  if (currentId) setActive(currentId, linkById, activeState, marker, railById);
}

function scrollToHeading(target) {
  // CSS `scroll-margin-block-start` on headings supplies the offset, so a
  // native scroll avoids stacking a second, JS-computed offset on top of it.
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setPeek(next, aside, peekState) {
  if (peekState.value === next) return;
  peekState.value = next;
  aside.setAttribute('data-toc-peek', next);
}

// Retreats the rail on scroll down and brings it back on scroll up. Direction is
// the one part CSS cannot express; the motion itself lives in blog-toc.css.
function updatePeekFromScroll(aside, peekState) {
  if (!aside) return;

  const y = window.scrollY;
  const delta = y - peekState.lastY;
  peekState.lastY = y;

  // Never retreat while the panel is open, or before you have left the top
  if (aside.getAttribute('data-toc-open') === 'true' || y < PEEK_WAKE_NEAR_TOP) {
    setPeek('active', aside, peekState);
    return;
  }

  if (delta > PEEK_DELTA_THRESHOLD) setPeek('idle', aside, peekState);
  else if (delta < -PEEK_DELTA_THRESHOLD) setPeek('active', aside, peekState);
}

function handleTocClick(linkById, activeState, marker, railById, closePanel, event) {
  const { target } = event;
  const link = target.closest?.('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;

  const id = href.slice(1);
  const heading = document.getElementById(id);
  if (!heading) return;

  event.preventDefault();

  scrollToHeading(heading);

  window.history.replaceState(null, '', `#${id}`);

  setActive(id, linkById, activeState, marker, railById);

  // Where the panel sits over the text, reading the heading means getting it out of the way
  if (window.matchMedia(OVERLAY_LAYOUT).matches) closePanel();
}

export default function initBlogToc() {
  const main = document.querySelector('main:has(.blog-toc)');
  if (!main) return;

  const article = main.querySelector('article');
  const aside = main.querySelector('.blog-layout__aside');
  const nav = main.querySelector('.blog-toc');
  const list = nav?.querySelector('.blog-toc__list');

  if (!article || !nav || !list) return;

  const headings = Array.from(
    article.querySelectorAll(':is(h2, h3, h4, h5, h6):not([data-toc-skip=true])'),
  );

  headings.forEach((heading) => {
    if (!heading.parentElement?.classList.contains('heading-anchor')) {
      const anchor = document.createElement('a');
      anchor.href = `#${heading.id}`;
      anchor.className = 'heading-anchor';
      anchor.setAttribute('aria-label', `Link to ${heading.textContent}`);

      heading.parentNode.insertBefore(anchor, heading);
      anchor.appendChild(heading);

      const icon = document.createElement('span');
      icon.className = 'anchor-icon';
      heading.appendChild(icon);
    }
  });

  const links = Array.from(list.querySelectorAll('a[href^="#"]'));
  const linkById = new Map();

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const id = href.slice(1);
    if (id) linkById.set(id, link);
  });

  if (!headings.length || !linkById.size) {
    if (aside) aside.remove();
    return;
  }

  const rail = aside?.querySelector('.blog-toc-rail');
  const railById = new Map();

  rail?.querySelectorAll('.blog-toc-rail__dash').forEach((dash) => {
    const id = dash.getAttribute('data-toc-target');
    if (id) railById.set(id, dash);
  });

  const marker = document.createElement('div');
  marker.className = 'blog-toc__marker';
  nav.appendChild(marker);

  const activeState = { value: null };
  // Starts active without writing the attribute, so the rail does not animate in on load
  const peekState = { value: 'active', lastY: window.scrollY };

  const wakePeek = () => setPeek('active', aside, peekState);

  const openPanel = () => {
    aside.setAttribute('data-toc-open', 'true');
    rail.setAttribute('aria-expanded', 'true');
    wakePeek();

    const link = linkById.get(activeState.value);
    moveMarker(link?.parentElement, marker);
  };

  const closePanel = () => {
    aside.setAttribute('data-toc-open', 'false');
    rail.setAttribute('aria-expanded', 'false');
  };

  // Scroll events can outpace paint, so coalesce to one update per frame
  let scrollFrame = 0;
  const handleScroll = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateActiveFromScroll(headings, linkById, activeState, marker, railById);
      updatePeekFromScroll(aside, peekState);
    });
  };
  const handleResize = () => {
    updateActiveFromScroll(headings, linkById, activeState, marker, railById);
    if (activeState.value) {
      const link = linkById.get(activeState.value);
      const item = link && link.parentElement;
      moveMarker(item, marker);
    }
  };
  const handleClick = handleTocClick.bind(
    null,
    linkById,
    activeState,
    marker,
    railById,
    closePanel,
  );

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  list.addEventListener('click', handleClick);

  const initialId = window.location.hash.slice(1);
  if (initialId && linkById.has(initialId)) {
    setActive(initialId, linkById, activeState, marker, railById);
  } else {
    updateActiveFromScroll(headings, linkById, activeState, marker, railById);
  }

  // Panel toggle: the rail opens and closes it, an outside click closes it,
  // and clicks inside the panel leave it open.
  if (rail && aside) {
    rail.addEventListener('click', () => {
      if (aside.getAttribute('data-toc-open') === 'true') closePanel();
      else openPanel();
    });

    aside.addEventListener('focusin', wakePeek);

    // Hover only: on touch `pointerenter` fires with `pointerdown`, and sliding the
    // rail back under a finger moves it out from under the eventual `pointerup`
    if (window.matchMedia('(hover: hover)').matches) {
      aside.addEventListener('pointerenter', wakePeek);
    }

    document.addEventListener('click', (event) => {
      if (aside.getAttribute('data-toc-open') !== 'true') return;
      if (!aside.contains(event.target)) closePanel();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (aside.getAttribute('data-toc-open') !== 'true') return;
      closePanel();
      rail.focus();
    });
  }
}
