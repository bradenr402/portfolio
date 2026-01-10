import parseHTML from './parse-html';

const requireIcons = require.context('./images/icons', false, /\.svg$/);

export default function setupIcons() {
  for (const element of document.querySelectorAll('[data-icon]')) {
    const iconName = element.dataset.icon;

    let iconFile;
    try {
      iconFile = requireIcons(`./${iconName}.svg`);
    } catch (error) {
      // Icon not found; safely skip this element
      continue;
    }

    const svgElement = parseHTML(iconFile);

    // Copy Tailwind classes from the div to the SVG element
    svgElement.classList.add(...element.classList);

    element.replaceWith(svgElement);
  }
}
