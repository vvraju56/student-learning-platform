import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  loading: false,
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
});
