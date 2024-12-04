import toggleScroll from './toggle-scroll';

export default function setupMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!mobileMenuButton || !mobileMenu) return;

  const toggleMenu = () => {
    mobileMenu.classList.toggle('mobile-menu-hidden');
    toggleScroll();
  };
  const closeMenu = () => {
    mobileMenu.classList.add('mobile-menu-hidden');
    toggleScroll(false);
  };

  const handleClickOutside = (event) => {
    const links = document.querySelectorAll('a.nav-link-text');
    const isClickOnLink = Array.from(links).some((link) => link.contains(event.target));

    const isClickOnButton = mobileMenuButton.contains(event.target);

    if (!isClickOnLink && !isClickOnButton) closeMenu();
  };

  mobileMenuButton.addEventListener('mousedown', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeMenu());
  document.addEventListener('mousedown', handleClickOutside);
}
