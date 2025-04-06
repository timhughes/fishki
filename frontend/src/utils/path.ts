export const addMdExtension = (path: string): string => {
  if (!path) return path;
  
  // Don't add .md extension to paths ending with /
  if (path.endsWith('/')) return path;
  
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
  if (!path || path === '/') return '/';
  
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  
  parts.pop();
  return parts.length === 0 ? '/' : '/' + parts.join('/');
};

export const getPathSegments = (path: string): string[] => {
  if (!path || path === '/') return [];
  return path.split('/').filter(Boolean);
};

export const isRootPath = (path: string): boolean => {
  return path === '/';
};

export const joinPaths = (...paths: string[]): string => {
  const cleanPaths = paths.map(p => p.replace(/^\/+|\/+$/g, '')).filter(Boolean);
  return cleanPaths.length === 0 ? '/' : '/' + cleanPaths.join('/');
};
