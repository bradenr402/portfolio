// Suppresses color transitions for one frame when the OS light/dark
// preference flips, so every themed color doesn't visibly animate at once.
export default function initThemeTransitionGuard() {
  const query = window.matchMedia('(prefers-color-scheme: dark)');

  query.addEventListener('change', () => {
    const { documentElement } = document;

    documentElement.dataset.themeSwitching = '';

    // Force a reflow so the attribute is applied before transitions resume.
    void documentElement.offsetHeight;

    requestAnimationFrame(() => {
      delete documentElement.dataset.themeSwitching;
    });
  });
}
