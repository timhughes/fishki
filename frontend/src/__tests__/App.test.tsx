import React from 'react';
import { render, screen } from '@testing-library/react';
// Add the following line to ensure Jest types are recognized
import '@testing-library/jest-dom';
import App from '../App';

test('renders the app component', () => {
  render(<App />);
  expect(screen.getByText(/vite \+ react/i)).toBeInTheDocument();
});
