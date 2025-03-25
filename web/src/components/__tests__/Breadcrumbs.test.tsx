import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils/test-utils';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  it('should hide breadcrumbs on root path', () => {
    render(<Breadcrumbs />, { initialEntries: ['/'] });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should display home link for non-root paths', () => {
    render(<Breadcrumbs />, { initialEntries: ['/page'] });
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should display nested path segments', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/page'] });
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });

  it('should display editing indicator in edit mode', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/page/edit'] });
    expect(screen.getByText(/\(Editing\)/)).toBeInTheDocument();
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page (Editing)')).toBeInTheDocument();
  });

  it('should generate correct links for intermediate paths', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/subfolder/page'] });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3); // Home + 2 intermediate paths
    expect(links[1]).toHaveAttribute('href', '/folder');
    expect(links[2]).toHaveAttribute('href', '/folder/subfolder');
  });

  it('should remove .md extension from display text', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/test.md'] });
    expect(screen.queryByText('.md')).not.toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle index page for root path', () => {
    render(<Breadcrumbs />, { initialEntries: ['/'] });
    expect(screen.queryByText('index')).not.toBeInTheDocument();
  });

  it('should display multiple nested path segments', () => {
    render(<Breadcrumbs />, { initialEntries: ['/a/b/c/d/page'] });
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });
});
