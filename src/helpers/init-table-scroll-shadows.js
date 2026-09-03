export default function initTableScrollShadows() {
  const wrappers = Array.from(document.querySelectorAll('.table-wrapper'));
  if (!wrappers.length) return;

  // Skip no-op writes: dirtying layout inside a ResizeObserver callback re-triggers it
  const setProperty = (element, property, value) => {
    if (element.style.getPropertyValue(property) === value) return;
    element.style.setProperty(property, value);
  };

  const update = (wrapper) => {
    const scroller = wrapper.querySelector('.table-scroll');

    // With no overflow the scroll timeline is inactive and the shadows freeze in their fill state
    const isScrollable = scroller.scrollWidth - scroller.clientWidth > 1;
    wrapper.classList.toggle('is-not-scrollable', !isScrollable);

    // Start the leading shadow after a sticky first column so it falls on the content, not the column
    const stickyCell = scroller.querySelector('thead th:first-child.sticky');
    const stickyInlineSize = stickyCell ? stickyCell.getBoundingClientRect().width : 0;
    setProperty(wrapper, '--table-sticky-inline-size', `${stickyInlineSize}px`);
  };

  let frame = null;
  const scheduleUpdate = () => {
    if (frame !== null) return;

    frame = requestAnimationFrame(() => {
      frame = null;
      wrappers.forEach(update);
    });
  };

  const observer = new ResizeObserver(scheduleUpdate);

  wrappers.forEach((wrapper) => {
    update(wrapper);

    // The scroller catches viewport resizes; the table catches content reflow (late fonts, images)
    const scroller = wrapper.querySelector('.table-scroll');
    observer.observe(scroller);
    observer.observe(scroller.querySelector('table'));
  });
}
