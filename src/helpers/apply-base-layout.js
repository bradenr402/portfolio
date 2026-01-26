import fs from 'fs';
import path from 'path';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const NAV_PATH = path.join(SRC_DIR, 'components', '_nav.html');
const FOOTER_PATH = path.join(SRC_DIR, 'components', '_footer.html');
const ICONS_DIR = path.join(SRC_DIR, 'images', 'icons');

const navHtml = fs.readFileSync(NAV_PATH, 'utf8');
const footerHtml = fs.readFileSync(FOOTER_PATH, 'utf8');

const iconCache = new Map();

function getIconSvg(name) {
  if (!iconCache.has(name)) {
    const iconPath = path.join(ICONS_DIR, `${name}.svg`);

    if (!fs.existsSync(iconPath)) {
      iconCache.set(name, null);
    } else {
      const svg = fs.readFileSync(iconPath, 'utf8');
      iconCache.set(name, svg);
    }
  }

  return iconCache.get(name);
}

function injectNav(html) {
  const dom = new JSDOM(html);
  const navPlaceholder = dom.window.document.getElementById('nav');
  if (!navPlaceholder) return html;

  const fragment = JSDOM.fragment(navHtml);
  navPlaceholder.replaceWith(fragment);
  return dom.serialize();
}

function injectFooter(html) {
  const dom = new JSDOM(html);
  const footerPlaceholder = dom.window.document.getElementById('footer');
  if (!footerPlaceholder) return html;

  const fragment = JSDOM.fragment(footerHtml);
  footerPlaceholder.replaceWith(fragment);
  return dom.serialize();
}

function setFooterYear(html) {
  const dom = new JSDOM(html);
  const footerYearSpan = dom.window.document.getElementById('footer-year');
  if (!footerYearSpan) return html;

  const year = new Date().getFullYear().toString();
  footerYearSpan.textContent = year;
  return dom.serialize();
}

function inlineIcons(html) {
  const dom = new JSDOM(html);

  for (const element of dom.window.document.querySelectorAll('span[data-icon]')) {
    const iconName = element.dataset.icon;
    const svgContent = getIconSvg(iconName);
    if (!svgContent) continue;

    const fragment = JSDOM.fragment(svgContent);
    const svgElement = fragment.querySelector('svg');
    if (!svgElement) continue;

    svgElement.dataset.icon = iconName;
    svgElement.classList.add(...element.classList);

    element.replaceWith(svgElement);
  }

  return dom.serialize();
}

function highlightCodeBlocks(html) {
  const dom = new JSDOM(html);
  const codeBlocks = dom.window.document.querySelectorAll('pre > code');

  for (const codeEl of codeBlocks) {
    const classList = Array.from(codeEl.classList);
    const langClass = classList.find(c => c.startsWith('language-'));
    const explicitLang = langClass?.replace(/^language-/, '');

    const codeText = codeEl.textContent || '';
    if (!codeText.trim()) continue;

    let result;
    if (explicitLang && hljs.getLanguage(explicitLang)) {
      result = hljs.highlight(codeText, { language: explicitLang });
    } else {
      result = hljs.highlightAuto(codeText);
    }

    codeEl.innerHTML = result.value;

    codeEl.classList.add('hljs');
    const finalLang = explicitLang || result.language;
    if (finalLang) codeEl.classList.add(`language-${finalLang}`);
  }

  return dom.serialize();
}

export default function applyBaseLayout(html) {
  return [
    injectNav,
    injectFooter,
    setFooterYear,
    inlineIcons,
    highlightCodeBlocks
  ].reduce((result, fn) => fn(result), html)
}
