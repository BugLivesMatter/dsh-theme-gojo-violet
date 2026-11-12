// Pre-install smoke test: execute the generated client bundle against stubs of
// the module loader, DOM and ui-theme service, then dispose everything.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const PACKAGE = '@local/theme-gojo-violet';

let registered;
const windowStub = {
  __ModuleLoader__: {
    load(entry) {
      registered = entry;
    },
  },
};

const styleElements = [];
const documentStub = {
  head: {
    append(element) {
      styleElements.push(element);
      element.isConnected = true;
    },
  },
  createElement(tag) {
    return {
      tagName: tag,
      dataset: {},
      textContent: '',
      remove() {
        this.isConnected = false;
        styleElements.splice(styleElements.indexOf(this), 1);
      },
    };
  },
};

const sandbox = { window: windowStub, document: documentStub, console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'client.js' });

if (!registered) throw new Error('module loader received no registration');
if (registered.id !== PACKAGE) throw new Error(`id mismatch: ${registered.id}`);

const exports = registered.factory({
  asset: (reference) => {
    if (!/\/assets\/gojo-wallpaper\.[0-9a-f]{12}\.jpg$/.test(reference)) throw new Error(`unexpected asset reference: ${reference}`);
    return reference;
  },
});

if (!Array.isArray(exports.inject) || !exports.inject.includes('theme')) throw new Error('missing theme inject');
if (typeof exports.apply !== 'function') throw new Error('missing apply');

const effects = [];
const calls = {
  overrides: undefined,
  styleCount: 0,
};
const ctx = {
  effect(factory, label) {
    effects.push({ factory, label });
  },
  theme: {
    overrideTokens(source, tokens) {
      calls.overrides = { source, tokens };
      return () => {};
    },
  },
};

exports.apply(ctx);
if (effects.length !== 2) throw new Error(`expected 2 effects, got ${effects.length}`);

const cleanups = effects.map((effect) => effect.factory());
for (const cleanup of cleanups) if (typeof cleanup !== 'function') throw new Error('effect did not return a cleanup');

const { source: overrideSource, tokens } = calls.overrides ?? {};
if (overrideSource !== PACKAGE) throw new Error(`override source mismatch: ${overrideSource}`);

const names = Object.keys(tokens ?? {});
if (names.length !== 119) throw new Error(`expected 119 tokens, got ${names.length}`);
for (const name of names) {
  const pair = tokens[name];
  if (typeof pair !== 'object' || typeof pair.light !== 'string' || typeof pair.dark !== 'string') {
    throw new Error(`token ${name} is not a {light,dark} pair`);
  }
}

if (styleElements.length !== 1) throw new Error(`expected one style element, got ${styleElements.length}`);
const css = styleElements[0].textContent;
if (!/url\("plugins\/@local\/theme-gojo-violet\/assets\/gojo-wallpaper\.[0-9a-f]{12}\.jpg"\)/.test(css)) {
  throw new Error('wallpaper URL missing from stylesheet');
}
if (css.includes('__WALLPAPER_URL__')) throw new Error('wallpaper placeholder not replaced');
if (!css.includes('.mP3x-q_centerCol')) throw new Error('shell selector missing from stylesheet');

// Disposal removes the stylesheet and releases both effects.
for (const cleanup of cleanups) cleanup();
if (styleElements.length !== 0) throw new Error('stylesheet was not removed on dispose');

console.log('smoke test ok');
console.log('tokens:', names.length);
console.log('style bytes:', css.length);
console.log('wallpaper reference:', css.match(/url\("([^"]+)"\)/)?.[1]);

