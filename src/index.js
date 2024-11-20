import './style.css';
import nav from './components/nav.html';

const parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html').body.firstChild;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav').replaceWith(parseHTML(nav));
});
