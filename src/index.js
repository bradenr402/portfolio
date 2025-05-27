import setFooterYear from './set-footer-year';
import setupIcons from './setup-icons';
import './style.css';

const init = () => {
  setFooterYear();
  setupIcons();
};

document.addEventListener('DOMContentLoaded', () => init());
