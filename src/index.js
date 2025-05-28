import setFooterYear from './set-footer-year';
import setupIcons from './setup-icons';
import initTheme from './theme';
import './style.css';

const init = () => {
  setFooterYear();
  setupIcons();
  initTheme();
};

document.addEventListener('DOMContentLoaded', () => init());
