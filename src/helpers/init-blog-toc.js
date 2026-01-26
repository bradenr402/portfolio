const VIEWPORT_LINE_RATIO = 0.25;
const SCROLL_OFFSET_RATIO = 0.15;

function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function moveMarker(item, marker) {
  if (!marker || !item) return;
  const nav = marker.parentElement;
  if (!nav) return;
  const navRect = nav.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const offset = 2;
  marker.style.top = `${itemRect.top - navRect.top + offset}px`;
  marker.style.height = `${itemRect.height - (offset * 2)}px`;
}

function setActive(id, linkById, activeState, marker) {
  if (!id || !linkById.has(id)) return;
  if (activeState.value === id) return;

  if (activeState.value && linkById.has(activeState.value)) {
    const prevLink = linkById.get(activeState.value);
    const prevItem = prevLink && prevLink.parentElement;
    if (prevItem) prevItem.classList.remove('blog-toc__item--active');
  }

  const link = linkById.get(id);
  const item = link && link.parentElement;
  if (item) {
    item.classList.add('blog-toc__item--active');
    if (marker) moveMarker(item, marker);
  }

  activeState.value = id;
}

function updateActiveFromScroll(headings, linkById, activeState, marker) {
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
  if (currentId) setActive(currentId, linkById, activeState, marker);
}

function scrollToHeadingWithOffset(target) {
  const viewportHeight = getViewportHeight();
  const rect = target.getBoundingClientRect();

  const offset = viewportHeight * SCROLL_OFFSET_RATIO;
  const targetY = window.pageYOffset + rect.top - offset;

  window.scrollTo({
    top: Math.max(targetY, 0),
    behavior: 'smooth',
  });
}

function handleTocClick(linkById, activeState, marker, event) {
  const target = event.target;
  const link = target.closest?.('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;

  const id = href.slice(1);
  const heading = document.getElementById(id);
  if (!heading) return;

  event.preventDefault();

  scrollToHeadingWithOffset(heading);

  history.replaceState(null, '', `#${id}`);

  setActive(id, linkById, activeState, marker);
}

export default function initBlogToc() {
  const main = document.querySelector('main.blog');
  if (!main) return;

  const article = main.querySelector('article');
  const aside = main.querySelector('.blog-layout__aside');
  const nav = main.querySelector('.blog-toc');
  const list = nav?.querySelector('.blog-toc__list');

  if (!article || !nav || !list) return;

  const headings = Array.from(article.querySelectorAll(':is(h2, h3, h4, h5, h6):not([data-toc-skip=true])'));

  headings.forEach((heading) => {
    if (!heading.querySelector('.anchor-link')) {
      const anchor = document.createElement('a');
      anchor.href = `#${heading.id}`;
      anchor.className = 'anchor-link';
      anchor.setAttribute('aria-label', `Link to ${heading.textContent}`);
      heading.prepend(anchor);
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

  nav.hidden = false;

  const marker = document.createElement('div');
  marker.className = 'blog-toc__marker';
  nav.appendChild(marker);

  const activeState = { value: null };

  const handleScroll = () => updateActiveFromScroll(headings, linkById, activeState, marker);
  const handleResize = () => {
    updateActiveFromScroll(headings, linkById, activeState, marker);
    if (activeState.value) {
      const link = linkById.get(activeState.value);
      const item = link && link.parentElement;
      moveMarker(item, marker);
    }
  };
  const handleClick = handleTocClick.bind(null, linkById, activeState, marker);

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  list.addEventListener('click', handleClick);

  const initialId = window.location.hash.slice(1);
  if (initialId && linkById.has(initialId)) {
    setActive(initialId, linkById, activeState, marker);
  } else {
    updateActiveFromScroll(headings, linkById, activeState, marker);
  }

  // Toggle logic
  const toggleBtn = main.querySelector('.blog-toc-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = nav.getAttribute('data-visible') === 'true';
      nav.setAttribute('data-visible', !isVisible);
    });

    document.addEventListener('click', (e) => {
      if (nav.getAttribute('data-visible') === 'true' && !nav.contains(e.target) && !toggleBtn.contains(e.target)) {
        nav.setAttribute('data-visible', 'false');
      }
    });
  }
}
