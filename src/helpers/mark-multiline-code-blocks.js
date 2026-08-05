export default function markMultilineCodeBlocks () {
  document
    .querySelectorAll('pre > code')
    .forEach((el) => {
      const isSingleLine = el.textContent.trim().split('\n').length === 1;
      if (!isSingleLine) el.classList.add('multi-line');
    });
};

