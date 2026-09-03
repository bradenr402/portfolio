export default function initTableScrollShadows() {
  const wrappers = Array.from(document.querySelectorAll('.table-wrapper'));
  if (!wrappers.length) return;

  const update = (wrapper) => {
    const scroller = wrapper.querySelector('.table-scroll');
    if (!scroller) return;

    // The scroll-driven edge shadows sit on an inactive timeline when there is
    // no scrollable overflow, which leaves them stuck in their fill state
    // instead of hidden. Flag the wrapper so the CSS can opt out entirely.
    const isScrollable = scroller.scrollWidth - scroller.clientWidth > 1;
    wrapper.classList.toggle('is-not-scrollable', !isScrollable);

    // A sticky first column is painted above the scrolling content, so the
    // leading shadow has to begin where that column ends. Otherwise it falls
    // across the frozen column rather than the content sliding underneath it.
    const stickyCell = scroller.querySelector('thead th:first-child.sticky');
    const stickyInlineSize = stickyCell ? stickyCell.getBoundingClientRect().width : 0;
    wrapper.style.setProperty('--table-sticky-inline-size', `${stickyInlineSize}px`);
  };

  const observer = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      const wrapper = target.closest('.table-wrapper');
      if (wrapper) update(wrapper);
    });
  });

  wrappers.forEach((wrapper) => {
    update(wrapper);

    // Watch both the scroll port and the table itself: the first catches
    // viewport resizes, the second catches content reflowing (late fonts,
    // images loading) without the port changing size.
    const scroller = wrapper.querySelector('.table-scroll');
    if (!scroller) return;

    observer.observe(scroller);

    const table = scroller.querySelector('table');
    if (table) observer.observe(table);
  });
}
