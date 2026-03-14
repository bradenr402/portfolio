const EPSILON = 0.01;      // Snap to the target when the remaining lerp distance falls below this value
const LERP = 0.12;         // Linear interpolation - fraction of the remaining distance applied each frame (higher = faster response)
const LIFT = 12;           // px - Vertical lift applied to the card on hover
const MAX_TILT = 13;       // deg - Maximum tilt angle of the card
const PERSPECTIVE = 600;   // px - Perspective distance (lower values increase 3D distortion)
const SHEEN_FACTOR = 3;    // Multiplier controlling sheen movement relative to tilt
const SCALE = 1.15;        // Scale applied to the card on hover

function applyTransform(card, state) {
  card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg) rotate(${state.rotation}deg) translateY(${state.translateY}px) scale(${state.scale})`;

  // tiltY shifts the sheen horizontally
  card.style.setProperty('--sheen-x', `${50 + state.tiltY * SHEEN_FACTOR}%`);

  // tiltX shifts the sheen vertically
  card.style.setProperty('--sheen-y', `${50 - state.tiltX * SHEEN_FACTOR}%`);

  card.style.setProperty('--sheen-opacity', `${state.sheenOpacity}`);
}

export default function initPhotoGallery() {
  for (const card of document.querySelectorAll('.photo-card')) {
    const idleRotation = parseFloat(card.style.getPropertyValue('--rotation')) || 0;

    const restState = { tiltX: 0, tiltY: 0, rotation: idleRotation, translateY: 0, scale: 1, sheenOpacity: 0 };
    const current = { ...restState };
    const target = { ...restState };
    const keys = Object.keys(restState);

    let animating = false;
    let hovered = false;

    function tick() {
      let settled = true;

      for (const k of keys) {
        const delta = target[k] - current[k];
        if (Math.abs(delta) > EPSILON) {
          current[k] += delta * LERP;
          settled = false;
        } else {
          current[k] = target[k];
        }
      }

      applyTransform(card, current);

      if (settled) {
        animating = false;

        if (!hovered) {
          card.style.transform = '';
          card.style.removeProperty('--sheen-x');
          card.style.removeProperty('--sheen-y');
          card.style.removeProperty('--sheen-opacity');
        }
      } else {
        requestAnimationFrame(tick);
      }
    }

    function startLoop() {
      if (animating) return;

      animating = true;
      requestAnimationFrame(tick);
    }

    // Normalize cursor position to -1..+1 relative to card center, then scale to degrees
    function updateTilt(e) {
      const rect = card.getBoundingClientRect();

      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;

      const centerX = rect.left + halfWidth;
      const centerY = rect.top + halfHeight;
      const normalizedX = (e.clientX - centerX) / halfWidth;
      const normalizedY = -(e.clientY - centerY) / halfHeight; // negated: screen Y is flipped (down == positive)

      target.tiltY =  normalizedX * MAX_TILT;
      target.tiltX = normalizedY * MAX_TILT;
    }

    card.addEventListener('mouseenter', (e) => {
      hovered = true;
      card.classList.add('is-hovered');

      Object.assign(target, { rotation: 0, translateY: -LIFT, scale: SCALE, sheenOpacity: 1 });
      updateTilt(e);
      startLoop();
    });

    card.addEventListener('mousemove', (e) => {
      if (!hovered) return;

      updateTilt(e);
      startLoop();
    });

    card.addEventListener('mouseleave', () => {
      hovered = false;
      card.classList.remove('is-hovered');

      Object.assign(target, restState);
      startLoop();
    });
  }
}
