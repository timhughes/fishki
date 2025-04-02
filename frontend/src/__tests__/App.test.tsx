import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

test('renders page browser', () => {
  render(<App />);
  expect(screen.getByText('Loading files...')).toBeInTheDocument();
});
