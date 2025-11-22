import { render, screen } from '@testing-library/react';
import LoginPage from '../login/page';
import { AuthContext } from '@/context/AuthContext';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders the login form', () => {
    const mockAuthContext = {
      user: null,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginPage />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
