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
  const currentUrl = window.location.href.replace(/\.html$/, '').replace(/^\//, '');
  const normalizedCurrentUrl = currentUrl === '' ? 'index' : currentUrl;

  links.forEach((link) => {
    const linkUrl = link.href.replace(/\.html$/, '').replace(/^\//, '');
    if (linkUrl === normalizedCurrentUrl) {
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
