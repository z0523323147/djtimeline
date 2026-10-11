export function embedApp(js, css) {
  // HTML parsers close script/style elements even inside JavaScript/CSS strings.
  const safeJS = js.replace(/<\/script/gi, '<\\/script');
  const safeCSS = css.replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1019"><title>Party map · DJ timeline</title><style>${safeCSS}</style></head><body><div id="app"></div><script>${safeJS}</script></body></html>`;
}
