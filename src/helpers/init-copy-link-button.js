export default function initCopyLinkButton() {
  const button = document.querySelector('.blog-copy-link');

  if (!button) return;

  const defaultIcon = button.querySelector('[data-icon="clipboard"]');
  const successIcon = button.querySelector('[data-icon="check"]');
  const defaultText = button.querySelector('[data-copy-link-text="default"]');
  const successText = button.querySelector('[data-copy-link-text="success"]');

  const showSuccess = (copied) => {
    defaultIcon?.classList.toggle('stacked-icon--hidden', copied);
    successIcon?.classList.toggle('stacked-icon--hidden', !copied);
    defaultText?.classList.toggle('stacked-text--hidden-above', copied);
    successText?.classList.toggle('stacked-text--hidden-below', !copied);
  };

  let timeout;

  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href);

    // Swapping aria-hidden announces "Copied!" via the aria-live text container
    showSuccess(true);
    defaultText?.setAttribute('aria-hidden', 'true');
    successText?.setAttribute('aria-hidden', 'false');

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      showSuccess(false);
      defaultText?.setAttribute('aria-hidden', 'false');
      successText?.setAttribute('aria-hidden', 'true');
      timeout = null;
    }, 2000);
  });
}
