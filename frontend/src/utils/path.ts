export const addMdExtension = (path: string): string => {
  if (!path) return path;
  return path.endsWith('.md') ? path : `${path}.md`;
};

export const removeMdExtension = (path: string): string => {
  if (!path) return path;
  return path.replace(/\.md$/, '');
};

export const getPageName = (path: string): string => {
  const parts = removeMdExtension(path).split('/');
  return parts[parts.length - 1] || '';
};

export const getParentPath = (path: string): string => {
  const parts = removeMdExtension(path).split('/');
  parts.pop();
  return parts.join('/');
};
