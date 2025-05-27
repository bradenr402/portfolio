export default function setFooterYear() {
  const yearElement = document.getElementById('footer-year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}
