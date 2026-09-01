import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient, ApiError } from '@/services/api-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Page', () => {
    it('renders login form with demo credentials buttons', () => {
      render(
        <AuthProvider>
          <QueryProvider>
            <LoginPage />
          </QueryProvider>
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Demo Accounts/i)).toBeInTheDocument();
    });

    it('submits valid credentials and calls API client', async () => {
      const user = userEvent.setup();
      const loginSpy = vi.spyOn(apiClient, 'login').mockResolvedValue({
        token: 'jwt.token.abc',
        refreshToken: 'refresh.token.abc',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        user: {
          id: 'user-1',
          email: 'customer@example.com',
          fullName: 'Alex Carter',
          role: 'ROLE_CUSTOMER',
          createdAt: new Date().toISOString(),
        },
      });

      const { container } = render(
        <AuthProvider>
          <QueryProvider>
            <LoginPage />
          </QueryProvider>
        </AuthProvider>
      );

      await user.type(screen.getByPlaceholderText(/name@example.com/i), 'customer@example.com');
      await user.type(screen.getByPlaceholderText(/••••••••/i), 'Password123!');

      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      await waitFor(() => {
        expect(loginSpy).toHaveBeenCalledWith({
          email: 'customer@example.com',
          password: 'Password123!',
        });
      });
    });

    it('displays error alert on 401 Bad Credentials', async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, 'login').mockRejectedValue(
        new ApiError(401, 'Bad credentials', 'UNAUTHORIZED')
      );

      const { container } = render(
        <AuthProvider>
          <QueryProvider>
            <LoginPage />
          </QueryProvider>
        </AuthProvider>
      );

      await user.type(screen.getByPlaceholderText(/name@example.com/i), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText(/••••••••/i), 'WrongPass!');

      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Register Page', () => {
    it('renders registration fields and password requirement badge', () => {
      render(
        <AuthProvider>
          <QueryProvider>
            <RegisterPage />
          </QueryProvider>
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Alex Carter/i)).toBeInTheDocument();
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    });
  });
});
