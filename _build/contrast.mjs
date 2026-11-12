import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));
const shared = data.shared;

const byName = (suffix) => shared[`--dsw-static-${suffix}`];

function srgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}
function luminance(hex) {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const round = (n) => Math.round(n * 100) / 100;

const modes = {
  light: {
    base: byName('neutral-bluish-00'),
    layer2: byName('neutral-bluish-00'),
    primary: byName('neutral-bluish-1000'),
    secondary: byName('neutral-bluish-700'),
    tertiary: byName('neutral-bluish-600'),
    caption: byName('neutral-bluish-400'),
    link: byName('deepseek-500'),
    brandFill: byName('neutral-bluish-1000'),
    brandLabel: byName('neutral-bluish-00'),
    toastBg: byName('neutral-bluish-800'),
    toastLabel: byName('neutral-bluish-00'),
    codeBg: byName('neutral-bluish-50'),
    bubble: byName('deepseek-50'),
  },
  dark: {
    base: byName('neutral-bluish-950'),
    layer2: byName('neutral-bluish-850'),
    primary: byName('neutral-bluish-50'),
    secondary: byName('neutral-bluish-300'),
    tertiary: byName('neutral-bluish-400'),
    caption: byName('neutral-bluish-600'),
    link: byName('deepseek-400'),
    brandFill: byName('neutral-bluish-50'),
    brandLabel: byName('neutral-bluish-1000'),
    toastBg: byName('neutral-bluish-750'),
    toastLabel: byName('neutral-bluish-00'),
    codeBg: byName('neutral-bluish-900'),
    bubble: byName('neutral-bluish-850'),
  },
};

const pairs = [
  ['label-primary / bg-base', 'primary', 'base', 4.5],
  ['label-secondary / bg-base', 'secondary', 'base', 4.5],
  ['label-tertiary / bg-base', 'tertiary', 'base', 4.5],
  ['label-caption / bg-base', 'caption', 'base', 3.0],
  ['label-primary / layer-2', 'primary', 'layer2', 4.5],
  ['link / bg-base', 'link', 'base', 4.5],
  ['primary button label / fill', 'brandLabel', 'brandFill', 4.5],
  ['toast label / toast bg', 'toastLabel', 'toastBg', 4.5],
  ['code text / code block', 'primary', 'codeBg', 4.5],
  ['label-primary / bubble', 'primary', 'bubble', 4.5],
];

for (const [mode, m] of Object.entries(modes)) {
  console.log(`\n== ${mode} ==`);
  for (const [label, fg, bg, target] of pairs) {
    const ratio = round(contrast(m[fg], m[bg]));
    const status = ratio >= target ? 'ok' : ratio >= 3 ? 'warn' : 'FAIL';
    console.log(`${status.padEnd(4)} ${String(ratio).padStart(5)} (>=${target})  ${label}  ${m[fg]} on ${m[bg]}`);
  }
}

