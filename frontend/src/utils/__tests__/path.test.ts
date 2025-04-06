import { 
  getParentPath, 
  getPathSegments, 
  isRootPath, 
  joinPaths,
  addMdExtension,
  removeMdExtension,
  getPageName
} from '../path';

describe('Path utilities', () => {
  describe('getParentPath', () => {
    it('returns parent path correctly', () => {
      expect(getParentPath('/path/to/file')).toBe('/path/to');
      expect(getParentPath('/path/to/')).toBe('/path');
      expect(getParentPath('/path')).toBe('/');
    });

    it('returns root for root path', () => {
      expect(getParentPath('/')).toBe('/');
    });

    it('handles empty path', () => {
      expect(getParentPath('')).toBe('/');
    });
  });

  describe('getPathSegments', () => {
    it('splits path into segments correctly', () => {
      expect(getPathSegments('/path/to/file')).toEqual(['path', 'to', 'file']);
      expect(getPathSegments('/path/to/')).toEqual(['path', 'to']);
      expect(getPathSegments('/path')).toEqual(['path']);
    });

    it('returns empty array for root path', () => {
      expect(getPathSegments('/')).toEqual([]);
    });

    it('handles empty path', () => {
      expect(getPathSegments('')).toEqual([]);
    });
  });

  describe('isRootPath', () => {
    it('identifies root path correctly', () => {
      expect(isRootPath('/')).toBe(true);
    });

    it('identifies non-root paths correctly', () => {
      expect(isRootPath('/path')).toBe(false);
      expect(isRootPath('/path/to/file')).toBe(false);
    });

    it('handles empty path', () => {
      expect(isRootPath('')).toBe(false);
    });
  });

  describe('joinPaths', () => {
    it('joins paths correctly', () => {
      expect(joinPaths('/path', 'to', 'file')).toBe('/path/to/file');
      expect(joinPaths('/path/', '/to/', '/file')).toBe('/path/to/file');
    });

    it('handles root path', () => {
      expect(joinPaths('/', 'file')).toBe('/file');
    });

    it('handles empty segments', () => {
      expect(joinPaths('/path', '', 'file')).toBe('/path/file');
    });
  });
  
  describe('addMdExtension', () => {
    it('adds .md extension if missing', () => {
      expect(addMdExtension('/path/to/file')).toBe('/path/to/file.md');
    });
    
    it('does not add extension if already present', () => {
      expect(addMdExtension('/path/to/file.md')).toBe('/path/to/file.md');
    });
    
    it('does not add extension to paths ending with /', () => {
      expect(addMdExtension('/path/to/folder/')).toBe('/path/to/folder/');
    });
    
    it('handles empty path', () => {
      expect(addMdExtension('')).toBe('');
    });
  });
  
  describe('removeMdExtension', () => {
    it('removes .md extension if present', () => {
      expect(removeMdExtension('/path/to/file.md')).toBe('/path/to/file');
    });
    
    it('does not modify path without extension', () => {
      expect(removeMdExtension('/path/to/file')).toBe('/path/to/file');
    });
    
    it('handles empty path', () => {
      expect(removeMdExtension('')).toBe('');
    });
  });
  
  describe('getPageName', () => {
    it('extracts page name from path', () => {
      expect(getPageName('/path/to/file')).toBe('file');
      expect(getPageName('/path/to/file.md')).toBe('file');
    });
    
    it('handles root path', () => {
      expect(getPageName('/')).toBe('');
    });
    
    it('handles empty path', () => {
      expect(getPageName('')).toBe('');
    });
  });
});
