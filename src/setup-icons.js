import parseHTML from './parse-html';

const requireIcons = require.context('./images/icons', false, /\.svg$/);

export default function setupIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => {
    const iconName = element.getAttribute('data-icon'); // Get the icon name from the data attribute

    // Dynamically import the SVG based on the icon name
    const iconFile = requireIcons(`./${iconName}.svg`);

    if (iconFile) {
      const svgElement = parseHTML(iconFile); // Parse the imported SVG content

      // Copy classes from the div to the SVG element
      svgElement.classList.add(...element.classList);

      // Replace the div with the SVG element
      element.replaceWith(svgElement);
    } else {
      console.error(`SVG icon "${iconName}" not found`);
    }
  });
}
