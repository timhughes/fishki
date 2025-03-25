import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

interface WrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

const AllTheProviders: React.FC<WrapperProps> = ({ children, initialEntries = ['/'] }) => {
  const theme = createTheme();
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  );
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[];
};

const customRender = (
  ui: React.ReactElement,
  { initialEntries, ...options }: CustomRenderOptions = {}
) => render(ui, { 
  wrapper: (props) => (
    <AllTheProviders {...props} initialEntries={initialEntries} />
  ),
  ...options 
});

// re-export everything
export * from '@testing-library/react';
export { customRender as render };
