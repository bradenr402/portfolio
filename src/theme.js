export default function initTheme() {
  setTheme(getInitialTheme());

  const toggleBtn = document.getElementById('toggle-theme');
  toggleBtn?.addEventListener('click', toggleTheme);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => setTheme(e.matches ? 'dark' : 'light'));
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  const isLight = !document.documentElement.classList.contains('dark');
  setTheme(isLight ? 'dark' : 'light');
}

function setTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);

  const toggleBtn = document.getElementById('toggle-theme');
  toggleBtn?.setAttribute('aria-pressed', theme === 'dark');
}
