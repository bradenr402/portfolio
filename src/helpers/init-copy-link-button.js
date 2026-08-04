export default function initCopyLinkButton() {
  const button = document.querySelector('.blog .blog-copy-link');

  if (!button) return;

  const defaultText = button.querySelector('[data-copy-link-text="default"]');
  const successText = button.querySelector('[data-copy-link-text="success"]');

  let timeout;

  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href);

    // Toggle state class; swapping aria-hidden announces "Copied!" via the
    // aria-live text container
    button.classList.add('copied');
    defaultText?.setAttribute('aria-hidden', 'true');
    successText?.setAttribute('aria-hidden', 'false');

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      button.classList.remove('copied');
      defaultText?.setAttribute('aria-hidden', 'false');
      successText?.setAttribute('aria-hidden', 'true');
      timeout = null;
    }, 2000);
  });
}
