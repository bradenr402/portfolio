export default function initCopyLinkButton() {
  const button = document.querySelector('.blog .blog-copy-link');

  if (!button) return;

  let timeout;

  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href);

    // Toggle state class
    button.classList.add('copied');

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      button.classList.remove('copied');
      timeout = null;
    }, 2000);
  });
}
