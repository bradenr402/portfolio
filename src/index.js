import footer from './components/footer.html';
import nav from './components/nav.html';
import setupMobileMenu from './setup-mobile-menu';
import setupModals from './setup-modals';
import './style.css';

const parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html').body.firstChild;

const addNav = () => {
  const element = document.getElementById('nav');
  if (element) element.replaceWith(parseHTML(nav));
};

const addFooter = () => {
  const element = document.getElementById('footer');
  if (element) element.replaceWith(parseHTML(footer));
};

const activateCurrentNavLink = () => {
  const links = document.querySelectorAll('a.nav-link-text');
  const currentPath = window.location.pathname.replace(/\.html$/, '');

  links.forEach((link) => {
    const linkPath = new URL(link.href).pathname.replace(/\.html$/, '');

    if (linkPath === currentPath) {
      link.classList.add('nav-link-text-active');
      link.nextElementSibling.classList.add('nav-link-bg-active');
    } else if (
      (currentPath === '/' || currentPath === '') &&
      (linkPath === '/index.html' || linkPath === '/index')
    ) {
      link.classList.add('nav-link-text-active');
      link.nextElementSibling.classList.add('nav-link-bg-active');
    }
  });
};

const init = () => {
  addNav();
  addFooter();
  activateCurrentNavLink();
  setupMobileMenu();
  setupModals();
};

document.addEventListener('DOMContentLoaded', () => init());
