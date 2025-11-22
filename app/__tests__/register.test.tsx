import { render, screen } from '@testing-library/react';
import RegisterPage from '../register/page';
import { AuthContext } from '@/context/AuthContext';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    const mockAuthContext = {
      user: null,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <RegisterPage />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });
});
