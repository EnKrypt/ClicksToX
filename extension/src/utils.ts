import { RawNodeDatum } from 'react-d3-tree';
import { Node } from './types';

export const getArticleSlug = (url: URL | undefined): string =>
  url?.pathname.substring(6) ?? '';

export const isWikipediaArticle = (href: string): boolean => {
  const url = new URL(href);
  return url.host === 'en.wikipedia.org' && url.pathname.startsWith('/wiki/');
};

export const transformNavigationTree = (tree: Node): RawNodeDatum => {
  const datum: RawNodeDatum = {
    name: getArticleSlug(new URL(tree.article)),
    attributes: {
      clickedAt: tree.when.toString(),
    },
    children: tree.children.length
      ? tree.children.map((child) => transformNavigationTree(child))
      : [],
  };
  return datum;
};
