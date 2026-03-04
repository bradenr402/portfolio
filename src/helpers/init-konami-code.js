const konamiCode = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

let konamiIndex = 0;
let lastKeyTime = 0;

export default function initKonamiCode() {
  document.addEventListener('keydown', (e) => {
    const currentTime = new Date().getTime();

    // Reset if too much time has passed since the last key press (e.g., 1 second)
    if (currentTime - lastKeyTime > 1000) {
      konamiIndex = 0;
    }
    lastKeyTime = currentTime;

    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        // Play cool effect
        const scrollY = window.scrollY + window.innerHeight / 2;
        document.body.style.transformOrigin = `50% ${scrollY}px`;
        document.body.style.transform = 'rotate(360deg)';
        document.body.style.transition = 'transform var(--ease-gentler-spring)';

        // Reset after animation
        setTimeout(() => {
          document.body.style.transform = '';
          document.body.style.transition = '';
        }, 1000);

        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
};
