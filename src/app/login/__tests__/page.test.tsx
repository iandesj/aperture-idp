import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign in to Aperture')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display descriptive text', () => {
    render(<LoginPage />);

    expect(
      screen.getByText('Enter your credentials to access the platform')
    ).toBeInTheDocument();
  });
});

