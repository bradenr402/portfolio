#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

import { textToSlug } from '../src/helpers/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const TIL_DIR = path.join(REPO_ROOT, 'src', 'til');

const USE_COLOR = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const c = {
  bold: (s) => (USE_COLOR ? `\x1b[1m${s}\x1b[22m` : s),
  dim: (s) => (USE_COLOR ? `\x1b[2m${s}\x1b[22m` : s),
  cyan: (s) => (USE_COLOR ? `\x1b[36m${s}\x1b[39m` : s),
  green: (s) => (USE_COLOR ? `\x1b[32m${s}\x1b[39m` : s),
  red: (s) => (USE_COLOR ? `\x1b[31m${s}\x1b[39m` : s),
  yellow: (s) => (USE_COLOR ? `\x1b[33m${s}\x1b[39m` : s),
};

function helpOptionsBlock() {
  const rows = [
    ['-t, --title', '<title>', 'Title for the TIL'],
    ['-l, --link', '<url>', 'Pre-fill the frontmatter link'],
    ['-d, --date', '<date>', 'Use a specific date (e.g. 2026-04-10, "yesterday"); defaults to today'],
    ['-s, --slug', '<slug>', 'Override the auto-generated slug'],
    ['-h, --help', '', 'Show this help'],
  ];
  const flagW = Math.max(...rows.map((r) => r[0].length));
  const valW = Math.max(...rows.map((r) => r[1].length));
  return rows
    .map(([f, v, d]) => `  ${f.padEnd(flagW)} ${v.padEnd(valW)}  ${d}`)
    .join('\n');
}

const HELP = `${c.bold('npm run til:new')} — create a new TIL entry

${c.bold('Usage')}
  npm run til:new                          interactive walkthrough
  npm run til:new -- -t "<title>" [opts]   one-shot mode
  npm run til:help                         show this help

${c.bold('Options')}
${helpOptionsBlock()}

${c.bold('Examples')}
  npm run til:new
  npm run til:new -- -t 'ruby allows passing a Hash to \`gsub\`'
  npm run til:new -- -t 'subtle dark-mode surfaces with \`color-mix()\`' -l https://mdn.io/color-mix
  npm run til:new -- -t '\`git switch\` is the modern \`git checkout\`' -d 2026-04-10

${c.dim('Tip: titles support Markdown; code-style words like `gsub` and acronyms like CSS are preserved as-typed.')}`;

function fail(message) {
  console.error(`${c.red('✗')} ${message}`);
  process.exit(1);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function parseArgs(argv) {
  const opts = {
    title: null, link: null, date: null, slug: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined) fail(`Missing value for ${a}`);
      i += 1;
      return v;
    };
    switch (a) {
      case '-h':
      case '--help':
        console.log(HELP);
        process.exit(0);
        break;
      case '-t':
      case '--title':
        opts.title = next();
        break;
      case '-l':
      case '--link':
        opts.link = next();
        break;
      case '-d':
      case '--date':
        opts.date = next();
        break;
      case '-s':
      case '--slug':
        opts.slug = next();
        break;
      default:
        if (a.startsWith('--title=')) opts.title = a.slice('--title='.length);
        else if (a.startsWith('--link=')) opts.link = a.slice('--link='.length);
        else if (a.startsWith('--date=')) opts.date = a.slice('--date='.length);
        else if (a.startsWith('--slug=')) opts.slug = a.slice('--slug='.length);
        else fail(`Unknown argument: ${a}\n\n${HELP}`);
    }
  }
  return opts;
}

function buildLocalDate(y, mo, d, original) {
  const date = new Date(y, mo - 1, d);
  if (
    date.getFullYear() !== y
    || date.getMonth() !== mo - 1
    || date.getDate() !== d
  ) {
    fail(`Invalid calendar date: ${original}.`);
  }
  return date;
}

function shiftDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function resolveDate(input) {
  if (!input) return new Date();
  const raw = String(input).trim();
  if (!raw) return new Date();
  const s = raw.toLowerCase();
  const today = new Date();

  // Relative keywords
  if (s === 'today' || s === 'now') return today;
  if (s === 'yesterday') return shiftDays(today, -1);
  if (s === 'tomorrow') return shiftDays(today, 1);

  let m = /^(\d+)\s+days?\s+ago$/.exec(s);
  if (m) return shiftDays(today, -Number(m[1]));
  m = /^(?:in\s+)?(\d+)\s+days?(?:\s+(?:from\s+now|ahead|hence))?$/.exec(s);
  if (m) return shiftDays(today, Number(m[1]));
  m = /^-(\d+)$/.exec(s); // -3 = 3 days ago
  if (m) return shiftDays(today, -Number(m[1]));
  m = /^\+(\d+)$/.exec(s); // +3 = 3 days ahead
  if (m) return shiftDays(today, Number(m[1]));
  if (/^\d+$/.test(s)) {
    fail(`Ambiguous date "${raw}". Use "+${raw}" for days ahead, "-${raw}" for days ago, "${raw} days ago", or a real date.`);
  }

  // ISO-ish: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(raw);
  if (m) return buildLocalDate(Number(m[1]), Number(m[2]), Number(m[3]), raw);

  // US-style: M/D/YYYY or M-D-YYYY
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw);
  if (m) return buildLocalDate(Number(m[3]), Number(m[1]), Number(m[2]), raw);

  // Short year: M/D/YY → 20YY
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/.exec(raw);
  if (m) return buildLocalDate(2000 + Number(m[3]), Number(m[1]), Number(m[2]), raw);

  // Long form: "May 1, 2026", "1 May 2026", "May 1 2026", etc.
  // Use Date.parse but extract local Y/M/D so timezone shifts don't move the day.
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) {
    const parsed = new Date(t);
    // Date.parse on bare YYYY-MM-DD treats input as UTC; that path is handled
    // above. For the natural-language path the local components are correct.
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  fail(`Could not parse date "${raw}". Try YYYY-MM-DD, M/D/YYYY, "May 1 2026", "yesterday", or "3 days ago".`);
  return null;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function uniqueTarget(dir, slug) {
  let candidate = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(candidate)) return { file: candidate, slug };
  for (let i = 2; i < 100; i += 1) {
    const s = `${slug}-${i}`;
    candidate = path.join(dir, `${s}.md`);
    if (!fs.existsSync(candidate)) return { file: candidate, slug: s };
  }
  fail(`Too many TILs already use the slug "${slug}" today.`);
  return null;
}

function yamlDoubleQuoted(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function splitEditorCommand(editor) {
  const tokens = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(editor)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  return tokens;
}

function prompt(label, hint) {
  const tag = c.green('?');
  const lbl = c.bold(label);
  const h = hint ? ` ${c.dim(`(${hint})`)}` : '';
  return `${tag} ${lbl}${h}${c.dim(' ›')} `;
}

function ask(rl, queue, label, hint) {
  const text = prompt(label, hint);
  if (rl.terminal) {
    rl.setPrompt(text);
    rl.prompt(true);
  } else {
    process.stdout.write(text);
  }
  if (queue.lines.length > 0) return Promise.resolve(queue.lines.shift());
  if (queue.closed) return Promise.resolve('');
  return new Promise((resolve) => { queue.pending = resolve; });
}

async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY === true,
  });
  const queue = { lines: [], pending: null, closed: false };
  rl.on('line', (line) => {
    if (queue.pending) {
      const r = queue.pending;
      queue.pending = null;
      r(line);
    } else {
      queue.lines.push(line);
    }
  });
  rl.on('close', () => {
    queue.closed = true;
    if (queue.pending) {
      const r = queue.pending;
      queue.pending = null;
      r('');
    }
  });
  try {
    console.log(`\n${c.bold(c.cyan('✨  New TIL'))}  ${c.dim('— answer the prompts (⏎ to accept defaults)')}\n`);

    const title = (await ask(rl, queue, 'Title')).trim();
    if (!title) fail('A title is required.');

    const inferredSlug = textToSlug(title);
    const slugInput = (await ask(rl, queue, 'Slug', `default: ${inferredSlug}`)).trim();

    const todayStr = formatDate(new Date());
    const dateInput = (await ask(rl, queue, 'Date', `default: ${todayStr}`)).trim();

    const linkInput = (await ask(rl, queue, 'Link', 'optional')).trim();

    const yn = (await ask(rl, queue, 'Open in $EDITOR?', 'Y/n')).trim().toLowerCase();
    const edit = yn !== 'n' && yn !== 'no';
    console.log();
    return {
      title,
      slug: slugInput || null,
      date: dateInput || null,
      link: linkInput || null,
      edit,
    };
  } finally {
    rl.close();
  }
}

const opts = parseArgs(process.argv.slice(2));

let input;
if (opts.title === null && opts.link === null && opts.date === null && opts.slug === null) {
  input = await runInteractive();
} else {
  const title = (opts.title ?? '').trim();
  if (!title) fail(`A title is required (use -t/--title).\n\n${HELP}`);
  input = {
    title,
    slug: opts.slug,
    date: opts.date,
    link: opts.link,
    edit: true,
  };
}

const slugSource = input.slug || input.title;
const slug = textToSlug(slugSource);
if (!slug) fail('Could not derive a slug from the given title.');

const date = resolveDate(input.date);
const targetDir = path.join(
  TIL_DIR,
  String(date.getFullYear()),
  pad(date.getMonth() + 1),
  pad(date.getDate()),
);
fs.mkdirSync(targetDir, { recursive: true });

const { file: targetFile, slug: finalSlug } = uniqueTarget(targetDir, slug);

const frontmatterLines = ['---', `title: ${yamlDoubleQuoted(input.title)}`];
if (input.link) frontmatterLines.push(`link: ${input.link}`);
frontmatterLines.push('---', '');
const stub = `${frontmatterLines.join('\n')}\n`;

fs.writeFileSync(targetFile, stub, 'utf8');

const relPath = path.relative(REPO_ROOT, targetFile);
const url = `/til/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${finalSlug}`;

console.log(`${c.green('✓')} ${c.bold('Created')} ${c.cyan(relPath)}`);
console.log(`  ${c.dim('Title:')}  ${input.title}`);
if (input.link) console.log(`  ${c.dim('Link: ')}  ${input.link}`);
console.log(`  ${c.dim('URL:  ')}  ${url} ${c.dim('(after next build)')}\n`);

if (!input.edit) process.exit(0);

const editor = process.env.EDITOR || process.env.VISUAL;
if (!editor) {
  console.log(c.dim('  (Set $EDITOR to have new TILs open automatically.)'));
  process.exit(0);
}

const [cmd, ...args] = splitEditorCommand(editor);
if (!cmd) {
  console.log(c.dim('  ($EDITOR is set but empty — skipping editor.)'));
  process.exit(0);
}
const child = spawn(cmd, [...args, targetFile], { stdio: 'inherit' });
child.on('error', (err) => {
  console.error(`  ${c.red('Could not launch editor')} "${cmd}": ${err.message}`);
  process.exit(0);
});
child.on('exit', (code) => process.exit(code ?? 0));
