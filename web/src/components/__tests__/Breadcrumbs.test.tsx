import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils/test-utils';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  it('should not show breadcrumbs on root path', () => {
    render(<Breadcrumbs />, { initialEntries: ['/'] });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should render home link when not on root', () => {
    render(<Breadcrumbs />, { initialEntries: ['/page'] });
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should show path parts for nested routes', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/page'] });
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });

  it('should show (Editing) when in edit mode', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/page/edit'] });
    expect(screen.getByText(/\(Editing\)/)).toBeInTheDocument();
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page (Editing)')).toBeInTheDocument();
  });

  it('should render correct links for intermediate paths', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/subfolder/page'] });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3); // Home + 2 intermediate paths
    expect(links[1]).toHaveAttribute('href', '/folder');
    expect(links[2]).toHaveAttribute('href', '/folder/subfolder');
  });

  it('should not include .md extension in display text', () => {
    render(<Breadcrumbs />, { initialEntries: ['/folder/test.md'] });
    expect(screen.queryByText('.md')).not.toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should treat empty filename as index', () => {
    render(<Breadcrumbs />, { initialEntries: ['/'] });
    expect(screen.queryByText('index')).not.toBeInTheDocument();
  });

  it('should handle deeply nested paths', () => {
    render(<Breadcrumbs />, { initialEntries: ['/a/b/c/d/page'] });
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });
});
