import footer from './components/footer.html';
import nav from './components/nav.html';
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
  console.log('Activating current nav link...');
  const links = document.querySelectorAll('a.nav-link-text');
  console.log('Found nav links:', links.length);
  const currentPath = window.location.pathname.replace(/\.html$/, '');
  console.log('Current path:', currentPath);

  links.forEach((link) => {
    const linkPath = new URL(link.href).pathname.replace(/\.html$/, '');
    console.log('Checking link path:', linkPath);

    if (linkPath === currentPath) {
      console.log('Match found - activating link:', linkPath);
      link.classList.add('nav-link-text-active');
      link.nextElementSibling.classList.add('nav-link-bg-active');
    } else if (
      (currentPath === '/' || currentPath === '') &&
      (linkPath === '/index.html' || linkPath === '/index')
    ) {
      console.log('Index page match found - activating link:', linkPath);
      link.classList.add('nav-link-text-active');
      link.nextElementSibling.classList.add('nav-link-bg-active');
    }
  });
};

const setupMobileMenu = () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('mobile-menu-hidden');
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
