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

const setupMobileMenu = () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!mobileMenuButton || !mobileMenu) return;

  const toggleMenu = () => mobileMenu.classList.toggle('mobile-menu-hidden');
  const closeMenu = () => mobileMenu.classList.add('mobile-menu-hidden');

  const handleClickOutside = (event) => {
    const isClickInsideMenu = mobileMenu.contains(event.target);
    const isClickOnButton = mobileMenuButton.contains(event.target);

    if (!isClickInsideMenu && !isClickOnButton) closeMenu();
  };

  mobileMenuButton.addEventListener('mousedown', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeMenu());
  document.addEventListener('mousedown', handleClickOutside);
};

const init = () => {
  addNav();
  addFooter();
  activateCurrentNavLink();
  setupMobileMenu();
  setupModals();
};

document.addEventListener('DOMContentLoaded', () => init());
