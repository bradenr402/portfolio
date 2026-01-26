import clipboardSvgContent from '../images/icons/clipboard.svg';
import checkSvgContent from '../images/icons/check.svg';

export default function initCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre > code');
  if (codeBlocks.length === 0) return;

  const parser = new DOMParser();
  const clipboardSvg = parser.parseFromString(clipboardSvgContent, 'image/svg+xml').documentElement;
  const checkSvg = parser.parseFromString(checkSvgContent, 'image/svg+xml').documentElement;

  const baseIconClasses = ['size-4', 'copy-code-btn__icon'];

  clipboardSvg.classList.add('copy-icon', ...baseIconClasses);
  checkSvg.classList.add('check-icon', ...baseIconClasses, 'copy-code-btn__icon--hidden');

  const buttonContent = clipboardSvg.outerHTML + checkSvg.outerHTML;

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;

    if (pre.parentElement.classList.contains('code-block-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper relative group';

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement('button');
    button.classList.add('copy-code-btn', 'group/clipboard');
    button.type = 'button';
    button.ariaLabel = 'Copy code';
    button.innerHTML = buttonContent;

    let timeoutId;

    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(codeBlock.textContent);

      const copyIcon = button.querySelector('.copy-icon');
      const checkIcon = button.querySelector('.check-icon');

      copyIcon.classList.add('copy-code-btn__icon--hidden');
      checkIcon.classList.remove('copy-code-btn__icon--hidden');

      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        copyIcon.classList.remove('copy-code-btn__icon--hidden');
        checkIcon.classList.add('copy-code-btn__icon--hidden');
        timeoutId = null;
      }, 2000);
    });

    wrapper.appendChild(button);
  });
}
