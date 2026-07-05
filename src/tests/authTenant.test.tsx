import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockGetActiveTenantSlug = vi.fn();
const mockUserMatchesActiveTenant = vi.fn();

vi.mock('@/lib/tenant', () => ({
  getActiveTenantSlug: mockGetActiveTenantSlug,
  setActiveTenantSlug: vi.fn(),
  userMatchesActiveTenant: mockUserMatchesActiveTenant,
  clearTenantAuthStorage: vi.fn(),
  getTenantSlugFromHost: vi.fn(),
  tenantStorageKey: vi.fn((key: string) => key),
}));

vi.mock('@/api/authService', () => ({
  authService: {
    saveTokens: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  },
}));

describe('AuthContext tenant handling', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetActiveTenantSlug.mockReset();
    mockUserMatchesActiveTenant.mockReset();
  });

  it('allows login when no tenant is active', async () => {
    mockGetActiveTenantSlug.mockReturnValue(null);
    mockUserMatchesActiveTenant.mockReturnValue(true);

    const { AuthProvider, useAuth } = await import('@/context/AuthContext');
    const authContext = { current: null as any };

    function TestConsumer() {
      const auth = useAuth();
      authContext.current = auth;
      return null;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<AuthProvider><TestConsumer /></AuthProvider>);
    });

    await act(async () => {
      authContext.current.login({
        user: {
          id: '1',
          email: 'nabin@gmail.com',
          name: 'Nabin',
          is_staff: false,
          is_superuser: false,
          is_admin: false,
          email_verified: true,
          role: 'customer',
          company: null,
        },
        access: 'abc',
        refresh: 'def',
      });
    });

    expect(authContext.current.user?.email).toBe('nabin@gmail.com');
    root.unmount();
    container.remove();
  });
});
