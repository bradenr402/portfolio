import footer from './components/footer.html';
import nav from './components/nav.html';
import './style.css';

const parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html').body.firstChild;

const addNavToDOM = () => {
  const element = document.getElementById('nav');
  if (element) element.replaceWith(parseHTML(nav));
};

const addFooterToDOM = () => {
  const element = document.getElementById('footer');
  if (element) element.replaceWith(parseHTML(footer));
};

const activateCurrentNavLink = () => {
  const links = document.querySelectorAll('a.nav-link-text');
  const currentUrl = window.location.href;

  links.forEach((link) => {
    if (link.href === currentUrl) {
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
  addNavToDOM();
  addFooterToDOM();
  activateCurrentNavLink();
  setupMobileMenu();
};

document.addEventListener('DOMContentLoaded', () => init());
