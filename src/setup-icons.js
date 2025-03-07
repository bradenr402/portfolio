import parseHTML from './parse-html';

const requireIcons = require.context('./images/icons', false, /\.svg$/);

export default function setupIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => {
    const iconName = element.getAttribute('data-icon');

    const iconFile = requireIcons(`./${iconName}.svg`);

    if (iconFile) {
      const svgElement = parseHTML(iconFile);

      // Copy Tailwind classes from the div to the SVG element
      svgElement.classList.add(...element.classList);

      element.replaceWith(svgElement);
    }
  });
}
