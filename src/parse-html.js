export default function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html').body.firstChild;
}
