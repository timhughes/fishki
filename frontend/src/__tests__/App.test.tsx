import React from 'react';
import { render, screen } from '@testing-library/react';
// Add the following line to ensure Jest types are recognized
import '@testing-library/jest-dom';
import App from '../App';

test('renders file browser', () => {
  render(<App />);
  expect(screen.getByText('Loading files...')).toBeInTheDocument();
});
