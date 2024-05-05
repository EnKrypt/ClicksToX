export const getArticleSlug = (url: URL | undefined): string =>
  url?.pathname.substring(6) ?? '';

export const isWikipediaArticle = (href: string): boolean => {
  const url = new URL(href);
  return url.host === 'en.wikipedia.org' && url.pathname.startsWith('/wiki/');
};
