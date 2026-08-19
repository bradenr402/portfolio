// Prevents navigation on inert demo links used in markdown examples
// (`markdoc-config.js` marks them with `data-demo-link` + `aria-disabled`).
export default function initDemoLinks() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-demo-link]')) event.preventDefault();
  });
}
