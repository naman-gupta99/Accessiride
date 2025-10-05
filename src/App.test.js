import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AccessiRide app', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { name: /AccessiRide/i });
  expect(headingElement).toBeInTheDocument();
});
