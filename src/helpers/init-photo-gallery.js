/*
  Photo-card hover tilt. All visual tuning lives in CSS (see the `photo-card` utility).

  * The card is a stable hover target; only its .photo-card-inner child tilts
  * Feeds CSS the pointer position via --tilt-x/--tilt-y, normalized to -1..1 from the card's center
*/

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function initPhotoGallery() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (const card of document.querySelectorAll('.photo-card')) {
    let rect;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
      card.classList.add('is-tilting');
    });

    card.addEventListener('mousemove', (e) => {
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // pointer's horizontal offset from card center: -1 (left edge) to 1 (right edge)
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // pointer's vertical offset from card center: -1 (top edge) to 1 (bottom edge)

      const tiltX = clamp(x, -1, 1);
      const tiltY = clamp(y, -1, 1);

      card.style.setProperty('--tilt-x', `${tiltX}`);
      card.style.setProperty('--tilt-y', `${tiltY}`);
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  }
}
