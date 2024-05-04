export const getArticleSlug = (url: URL | undefined): string =>
  url?.pathname.substring(6) ?? '';
