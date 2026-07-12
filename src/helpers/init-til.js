const VIEWPORT_LINE_RATIO = 0.25;     // Fraction of viewport height used to determine the active entry
const DATE_OFFSET = 9;                // px - Vertical offset to align the dot with the date label
const SUBSEQUENT_ENTRY_OFFSET = 32;   // px - Offset applied to all entries except the first to correct divider spacing
const TOP_TOLERANCE = 5;              // px - Distance from the top at which the next entry becomes active

function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function activeIndex(entries) {
  const lineY = getViewportHeight() * VIEWPORT_LINE_RATIO;

  let idx = 0;
  for (let i = 0; i < entries.length; i += 1) {
    const top = entries[i].getBoundingClientRect().top;

    if (top - 1 <= lineY) idx = i;
    else break;
  }
  while (
    idx < entries.length - 1
    && entries[idx].getBoundingClientRect().top + DATE_OFFSET < TOP_TOLERANCE
  ) {
    idx++;
  }

  return idx;
}

function moveDot(timeline, dot, entries, hoveredIndex) {
  const idx = hoveredIndex ?? activeIndex(entries);
  const tlRect = timeline.getBoundingClientRect();

  const targetRect = entries[idx].getBoundingClientRect();

  const baseOffset = targetRect.top - tlRect.top + DATE_OFFSET;
  const correction = (idx > 0) ? SUBSEQUENT_ENTRY_OFFSET : 0

  const dotY = baseOffset + correction;

  dot.style.transform = `translateY(${dotY}px)`;
  dot.setAttribute('data-ready', '');
}

function initTimeline(timeline) {
  const dot = timeline.querySelector('[data-timeline-dot]');
  const entries = Array.from(timeline.querySelectorAll('[data-timeline-entry]'));
  if (!dot || entries.length === 0) return;

  let hoveredIndex = null;
  let queued = false;
  const tick = () => {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      moveDot(timeline, dot, entries, hoveredIndex);
    });
  };

  // Skip hover-snap behavior on touch/coarse-pointer devices where
  // `mouseenter` fires from taps and would shift the dot mid-navigation.
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  if (supportsHover) {
    entries.forEach((entry, i) => {
      entry.addEventListener('mouseenter', () => {
        hoveredIndex = i;
        tick();
      });
      entry.addEventListener('mouseleave', () => {
        if (hoveredIndex === i) hoveredIndex = null;
        tick();
      });
    });
  }

  tick();
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
}

export default function initTilTimeline() {
  document.querySelectorAll('[data-timeline]').forEach(initTimeline);
}

// Apply max-height + fade only to entries whose content overflows enough to
// justify hiding part of it. Both the cap and the fade height are CSS variables
// on `.til-item__content`, so tweak them in `til.css` and the JS picks them up.
export function initTilContentClipping() {
  const contents = document.querySelectorAll('.til-item__content');
  if (contents.length === 0) return;

  const measure = () => {
    contents.forEach((el) => {
      el.removeAttribute('data-clipped');

      const styles = getComputedStyle(el);
      const maxPx = resolveLength(styles.getPropertyValue('--max-height'), el);
      const fadePx = resolveLength(styles.getPropertyValue('--fade-height'), el);

      // Only clip when the overflow exceeds the fade region. Otherwise the
      // fade gradient would hide more readable content than letting the
      // entry flow uncapped.
      if (el.scrollHeight > maxPx + fadePx) el.setAttribute('data-clipped', '');
    });
  };

  measure();
  window.addEventListener('resize', measure);
}

function resolveLength(value, contextEl) {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const number = parseFloat(trimmed);
  if (trimmed.endsWith('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return number * rootFontSize;
  }
  if (trimmed.endsWith('em')) {
    return number * parseFloat(getComputedStyle(contextEl).fontSize);
  }
  return number;
}
