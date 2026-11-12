/*
 * Gojo Violet Nebula — browser half.
 *
 * Registers a token override layer on the ui-theme service (the supported
 * third-party theming extension point) plus a plugin-owned stylesheet for the fixed wallpaper and transparent shell columns. Everything is registered through ctx.effect,
 * so disabling the plugin restores the stock theme and removes the artwork.
 */
window.__ModuleLoader__.load({
  id: '@local/theme-gojo-violet',
  factory(require) {
    const PACKAGE = '@local/theme-gojo-violet';
    const WALLPAPER = require.asset('plugins/@local/theme-gojo-violet/assets/__WALLPAPER_ASSET__');
    const CSS = __WALLPAPER_CSS_JSON__.replaceAll('__WALLPAPER_URL__', WALLPAPER);
    const TOKENS = __TOKENS_JSON__;

    return {
      inject: ['theme'],
      apply(ctx) {
        ctx.effect(
          () => ctx.theme.overrideTokens(PACKAGE, TOKENS),
          'gojo-violet: palette overrides',
        );

        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.dshTheme = PACKAGE;
          style.textContent = CSS;
          document.head.append(style);
          return () => {
            style.remove();
          };
        }, 'gojo-violet: wallpaper stylesheet');
      },
    };
  },
});


