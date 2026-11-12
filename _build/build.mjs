// Builds the Gojo Violet Nebula client bundle and the token audit fixture.
// Source of truth for the palette; edit the ladders/pairs here, then:
//   node _build/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function hsl(h, s, l) {
  return hslToHex(h, s, l);
}

function alpha(hex, a) {
  const h = hex.replace('#', '');
  const base = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const aHex = Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${base}${aHex}`;
}

function colorMix(hex, percent) {
  return `color-mix(in srgb, ${hex} ${percent}%, transparent)`;
}

// Violet-tinted neutral ramp shared by both palettes. Low steps are light-mode
// surfaces/text, high steps are dark-mode surfaces/text, exactly like the
// shipped design platform's neutral-bluish scale.
const NEUTRAL_HUE = 268;
const neutralLadder = [
  ['00', 100, 99.0], [50, 65, 97.4], [55, 55, 96.2], [60, 50, 95.0],
  [75, 42, 92.8], [90, 38, 90.6], [100, 36, 88.4], [150, 34, 86.0],
  [200, 32, 83.4], [250, 30, 80.8], [300, 27, 73.5], [310, 26, 71.0],
  [400, 22, 62.5], [500, 20, 55.0], [600, 19, 47.5], [700, 19, 39.5],
  [750, 21, 33.0], [800, 23, 27.5], [850, 25, 22.5], [875, 26, 19.0],
  [900, 28, 15.5], [950, 30, 11.0], [1000, 33, 7.0],
];

const neutral = Object.fromEntries(
  neutralLadder.map(([step, s, l]) => [`--dsw-static-neutral-bluish-${step}`, hsl(NEUTRAL_HUE, s, l)]),
);

// Electric violet accent ramp: replaces the DeepSeek blue family, so links,
// business state, bubbles and the focus ring follow Gojo's purple.
const accent = {
  '--dsw-static-deepseek-50': hsl(272, 100, 97.0),
  '--dsw-static-deepseek-100': hsl(272, 92, 92.0),
  '--dsw-static-deepseek-200': hsl(272, 85, 85.0),
  '--dsw-static-deepseek-300': hsl(272, 78, 76.0),
  '--dsw-static-deepseek-400': hsl(272, 72, 66.0),
  '--dsw-static-deepseek-450': hsl(272, 68, 60.0),
  '--dsw-static-deepseek-500': hsl(272, 65, 53.0),
  '--dsw-static-deepseek-600': hsl(272, 62, 45.0),
  '--dsw-static-deepseek-700-delete': hsl(272, 55, 34.0),
  '--dsw-static-deepseek-800': hsl(272, 52, 26.0),
  '--dsw-static-deepseek-900': hsl(272, 50, 19.0),
  '--dsw-static-deepseek-950': hsl(272, 48, 12.0),
};

// Periwinkle blue keeps selection, shimmer and "deep diving" cool instead of
// reintroducing the stock blue.
const blue = {
  '--dsw-static-blue-50': hsl(232, 100, 97.0),
  '--dsw-static-blue-50p': hsl(232, 100, 95.5),
  '--dsw-static-blue-75': hsl(232, 100, 94.0),
  '--dsw-static-blue-100': hsl(232, 90, 91.0),
  '--dsw-static-blue-300': hsl(232, 82, 82.0),
  '--dsw-static-blue-400': hsl(232, 76, 76.0),
  '--dsw-static-blue-450': hsl(232, 71, 72.0),
  '--dsw-static-blue-500': hsl(232, 66, 67.0),
  '--dsw-static-blue-600': hsl(232, 56, 58.0),
  '--dsw-static-blue-800': hsl(232, 46, 32.0),
  '--dsw-static-blue-900': hsl(232, 43, 24.0),
  '--dsw-static-blue-950': hsl(232, 41, 16.0),
};

const green = {
  '--dsw-static-green-100': hsl(158, 80, 92.0),
  '--dsw-static-green-400': hsl(158, 70, 62.0),
  '--dsw-static-green-500': hsl(158, 72, 47.0),
  '--dsw-static-green-900': hsl(158, 45, 16.0),
};
green['--dsw-static-green-500-a08'] = alpha(green['--dsw-static-green-500'], 0.08);
green['--dsw-static-green-500-a12'] = alpha(green['--dsw-static-green-500'], 0.12);

const red = {
  '--dsw-static-red-50': hsl(340, 100, 97.0),
  '--dsw-static-red-100': hsl(340, 100, 92.0),
  '--dsw-static-red-400': hsl(340, 85, 70.0),
  '--dsw-static-red-500': hsl(340, 80, 60.0),
  '--dsw-static-red-600': hsl(340, 75, 50.0),
  '--dsw-static-red-900': hsl(340, 60, 18.0),
};
red['--dsw-static-red-400-a12'] = alpha(red['--dsw-static-red-400'], 0.12);
red['--dsw-static-red-600-a08'] = alpha(red['--dsw-static-red-600'], 0.08);

const violet = {
  '--dsw-static-violet-400': hsl(268, 85, 78.0),
  '--dsw-static-violet-600': hsl(268, 70, 58.0),
};

const shared = { ...neutral, ...accent, ...blue, ...green, ...red, ...violet };

// Literal alias values the design platform does not derive from the ramps.
const pairs = {
  // Borders: violet-tinted hairlines
  '--dsw-alias-border-l1': { light: alpha(hsl(268, 40, 30), 0.06), dark: alpha(hsl(268, 90, 90), 0.07) },
  '--dsw-alias-border-l2': { light: alpha(hsl(268, 40, 30), 0.10), dark: alpha(hsl(268, 90, 90), 0.13) },
  '--dsw-alias-border-l3': { light: alpha(hsl(268, 40, 30), 0.14), dark: alpha(hsl(268, 90, 90), 0.17) },
  '--dsw-alias-border-l4': { light: alpha(hsl(268, 40, 30), 0.20), dark: alpha(hsl(268, 90, 90), 0.23) },
  '--dsw-alias-border-l2-darkmode-thin': { light: alpha(hsl(268, 40, 30), 0.10), dark: alpha(hsl(268, 90, 90), 0.07) },

  // Scrims and masks
  '--dsw-alias-bg-mask-1': { light: alpha(hsl(268, 50, 14), 0.24), dark: alpha(hsl(268, 60, 3), 0.52) },
  '--dsw-alias-bg-mask-2': { light: alpha(hsl(268, 50, 14), 0.12), dark: alpha(hsl(268, 60, 3), 0.20) },
  '--dsw-alias-bg-mask-3': { light: alpha(hsl(268, 55, 12), 0.48), dark: alpha(hsl(268, 60, 3), 0.52) },
  '--dsw-alias-bg-mask-photo': { light: alpha(hsl(268, 60, 4), 0.88), dark: alpha(hsl(268, 60, 2), 0.90) },
  '--dsw-alias-bg-mask-drop': { light: alpha(hsl(270, 80, 98), 0.72), dark: alpha(hsl(268, 40, 16), 0.72) },

  // Interaction layers
  '--dsw-alias-interactive-bg-hover': { light: alpha(hsl(268, 40, 35), 0.05), dark: alpha(hsl(268, 80, 88), 0.08) },
  '--dsw-alias-interactive-bg-hover-accent': { light: alpha(hsl(268, 40, 35), 0.12), dark: alpha(hsl(268, 80, 88), 0.18) },
  '--dsw-alias-interactive-bg-hover-danger': { light: alpha(hsl(340, 80, 50), 0.06), dark: alpha(hsl(340, 85, 72), 0.16) },
  '--dsw-alias-interactive-bg-active': { light: alpha(hsl(268, 40, 35), 0.10), dark: alpha(hsl(268, 80, 88), 0.14) },
  '--dsw-alias-bg-skeleton': { light: alpha(hsl(268, 40, 35), 0.05), dark: alpha(hsl(268, 80, 95), 0.07) },

  // Selection
  '--dsw-alias-bg-document-selection': {
    light: colorMix(hsl(272, 70, 52), 32),
    dark: colorMix(hsl(272, 80, 70), 40),
  },

  // Glass menus (keep the platform's translucency contract)
  '--dsw-menu-surface-fill': { light: alpha(hsl(270, 100, 98), 0.72), dark: alpha(hsl(268, 35, 15), 0.66) },
  '--dsw-alias-menu-group-header-fill': { light: alpha(hsl(270, 100, 98), 0.95), dark: alpha(hsl(268, 35, 18), 0.95) },
  '--dsw-specific-menu': { light: alpha(hsl(270, 100, 98), 0.72), dark: alpha(hsl(268, 35, 15), 0.66) },

  // Shimmer and idle marks
  '--dsw-alias-label-shimmer': { light: alpha(hsl(268, 50, 30), 0.28), dark: alpha(hsl(268, 90, 90), 0.38) },
  '--dsw-alias-state-idle-primary': { light: hsl(268, 27, 73.5), dark: hsl(268, 30, 40) },

  // Brand accent used by some newer controls
  '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: hsl(272, 65, 53), dark: hsl(272, 76, 72) },
  '--dsw-focus-ring-color': { light: hsl(272, 65, 48), dark: hsl(272, 78, 74) },
  '--dsw-alias-onboarding-accent': { light: hsl(272, 65, 50), dark: hsl(272, 76, 72) },

  // Scrollbars
  '--dsw-alias-scrollbar-bg-l1': { light: hsl(268, 25, 82), dark: hsl(268, 25, 33) },
  '--dsw-alias-scrollbar-bg-l2': { light: hsl(268, 27, 77), dark: hsl(268, 27, 29) },
  '--dsw-alias-scrollbar-hover-l1': { light: hsl(268, 28, 72), dark: hsl(268, 25, 40) },
  '--dsw-alias-scrollbar-hover-l2': { light: hsl(268, 28, 67), dark: hsl(268, 26, 35) },

  // Inline code (the stock value uses the neutral gray family)
  '--dsw-alias-markdown-inline-code': { light: hsl(270, 70, 96), dark: hsl(268, 32, 22) },

  // Floating toolbar fills
  '--dsw-alias-button-tool-bar-fill-invisible': { light: alpha(hsl(268, 30, 18), 0.36), dark: alpha(hsl(268, 30, 12), 0.36) },
  '--dsw-alias-button-tool-bar-fill': { light: alpha(hsl(268, 30, 30), 0.46), dark: alpha(hsl(268, 30, 26), 0.46) },
  '--dsw-alias-button-tool-bar-hover': { light: alpha(hsl(268, 30, 30), 0.58), dark: alpha(hsl(268, 30, 30), 0.58) },

  // Code diffs and file diffs
  '--dsw-alias-file-diff-added-bg': { light: hsl(158, 55, 94), dark: hsl(158, 40, 15) },
  '--dsw-alias-file-diff-added-gutter': { light: hsl(158, 55, 96), dark: hsl(158, 40, 12) },
  '--dsw-alias-file-diff-added-marker': { light: hsl(158, 80, 32), dark: hsl(158, 70, 52) },
  '--dsw-alias-file-diff-deleted-bg': { light: hsl(340, 80, 95), dark: hsl(340, 42, 17) },
  '--dsw-alias-file-diff-deleted-gutter': { light: hsl(340, 80, 97), dark: hsl(340, 42, 13) },
  '--dsw-alias-file-diff-deleted-marker': { light: hsl(340, 80, 42), dark: hsl(340, 85, 72) },

  // Syntax colours: violet/rose/mint instead of the stock gray-green scheme
  '--shiki-token-constant': { light: hsl(272, 65, 45), dark: hsl(272, 82, 76) },
  '--shiki-token-string': { light: hsl(174, 80, 28), dark: hsl(172, 70, 66) },
  '--shiki-token-comment': { light: hsl(268, 14, 52), dark: hsl(268, 18, 62) },
  '--shiki-token-keyword': { light: hsl(336, 72, 44), dark: hsl(336, 90, 76) },
  '--shiki-token-parameter': { light: hsl(28, 80, 38), dark: hsl(30, 90, 68) },
  '--shiki-token-function': { light: hsl(268, 65, 40), dark: hsl(268, 88, 78) },
  '--shiki-token-string-expression': { light: hsl(158, 70, 30), dark: hsl(158, 65, 62) },
  '--shiki-token-punctuation': { light: hsl(268, 12, 42), dark: hsl(268, 16, 72) },
  '--shiki-token-link': { light: hsl(272, 65, 45), dark: hsl(272, 82, 76) },

  // Think gradients blend into the themed canvas
  '--dsw-linear-gradient-think': {
    light: `linear-gradient(180deg, ${hsl(270, 100, 99)} 20.19%, ${alpha(hsl(270, 100, 99), 0)} 100%)`,
    dark: `linear-gradient(180deg, ${hsl(268, 30, 11)} 20.19%, ${alpha(hsl(268, 30, 11), 0)} 100%)`,
  },
  '--dsw-linear-think-select': {
    light: `linear-gradient(180deg, ${hsl(268, 30, 95)} 20.19%, ${alpha(hsl(268, 30, 95), 0)} 100%)`,
    dark: `linear-gradient(180deg, ${hsl(268, 30, 17)} 20.19%, ${alpha(hsl(268, 30, 17), 0)} 100%)`,
  },

  // Softer glass blur for the fixed wallpaper
  '--dsw-menu-backdrop-filter': { light: 'blur(28px) saturate(160%)', dark: 'blur(28px) saturate(160%)' },

  // Slightly rounder scale than the shipped design platform
  '--dsw-radius-xs': { light: '5px', dark: '5px' },
  '--dsw-radius-sm': { light: '10px', dark: '10px' },
  '--dsw-radius-md': { light: '14px', dark: '14px' },
  '--dsw-radius-lg': { light: '18px', dark: '18px' },
  '--dsw-radius-xl': { light: '24px', dark: '24px' },
  '--dsw-radius-panel': { light: '30px', dark: '30px' },
};

const tokens = {};
for (const [name, value] of Object.entries(shared)) tokens[name] = { light: value, dark: value };
for (const [name, value] of Object.entries(pairs)) tokens[name] = value;

const template = readFileSync(join(here, 'client.template.js'), 'utf8');
const css = readFileSync(join(here, 'wallpaper.css'), 'utf8');

// Emit the wallpaper under a content-revisioned name, the same contract the
// shipped build uses: /plugins assets are cached immutably and keyed by path,
// so a changed image needs a changed path.
const assetsDir = join(pkgRoot, 'assets');
mkdirSync(assetsDir, { recursive: true });
const raw = readFileSync(join(here, 'wallpaper-raw.jpg'));
const hash = createHash('sha1').update(raw).digest('hex').slice(0, 12);
const assetName = `gojo-wallpaper.${hash}.jpg`;
for (const file of readdirSync(assetsDir)) {
  if (/^gojo-wallpaper\..+\.jpg$/.test(file) && file !== assetName) unlinkSync(join(assetsDir, file));
}
writeFileSync(join(assetsDir, assetName), raw);

const source = template
  .replace('__TOKENS_JSON__', JSON.stringify(tokens, null, 2))
  .replace('__WALLPAPER_ASSET__', assetName)
  .replace('__WALLPAPER_CSS_JSON__', JSON.stringify(css));

writeFileSync(join(pkgRoot, 'client.js'), source);
writeFileSync(join(here, 'tokens.json'), `${JSON.stringify({ shared, pairs, tokens, css, assetName }, null, 2)}\n`);
console.log('asset:', assetName);
console.log('client.js bytes:', source.length);
console.log('tokens:', Object.keys(tokens).length);
