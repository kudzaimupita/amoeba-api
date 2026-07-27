export interface HtmlReplacementConfig {
  title?: string;
  description?: string;
  favicon?: string;
  themeColor?: string;
}

export function replaceHtmlContent(htmlContent: string, config: HtmlReplacementConfig): string {
  let modifiedHtml = htmlContent;

  if (config.title) {
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${config.title}</title>`);
  }

  if (config.description) {
    modifiedHtml = modifiedHtml.replace(
      /<meta name="description" content=".*?"\/>/i,
      `<meta name="description" content="${config.description}" />`
    );
  }

  if (config.favicon) {
    modifiedHtml = modifiedHtml.replace(
      /<link rel="icon"[^>]*\/>/i,
      `<link rel="icon" type="image/svg+xml" href="${config.favicon}" />`
    );
  }

  if (config.themeColor) {
    modifiedHtml = modifiedHtml.replace(
      /<meta name="theme-color" content=".*?"\/>/i,
      `<meta name="theme-color" content="${config.themeColor}" />`
    );
  }

  return modifiedHtml;
}