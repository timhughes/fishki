import React from 'react';
import { render, RenderOptions, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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
) => {
  const rendered = render(ui, { 
    wrapper: (props) => (
      <AllTheProviders {...props} initialEntries={initialEntries} />
    ),
    ...options 
  });

  return {
    ...rendered,
    rerender: (ui: React.ReactElement) => {
      return act(async () => {
        rendered.rerender(ui);
        // Wait for all effects to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    },
    // Helper method to wait for effects
    waitForEffects: async () => {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    }
  };
};

// re-export everything
export * from '@testing-library/react';
export { customRender as render };
