import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "@/api/authService";
import { setCartUserId } from "@/stores/cart";
import {
  getActiveTenantSlug,
  setActiveTenantSlug,
  userMatchesActiveTenant,
  clearTenantAuthStorage,
  getTenantSlugFromHost,
} from "@/lib/tenant";

export interface UserCompany {
  id: string;
  slug: string;
  name: string;
  theme_color?: string;
  category?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  email_verified: boolean;
  role: string;
  company: UserCompany | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { user: User; access: string; refresh: string }) => void;
  logout: () => void;
  tenantSlug: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState<string | null>(getActiveTenantSlug());

  const applyTenantSlug = useCallback(() => {
    const hostSlug = getTenantSlugFromHost();
    if (hostSlug) {
      setActiveTenantSlug(hostSlug);
      setTenantSlug(hostSlug);
    } else {
      setTenantSlug(getActiveTenantSlug());
    }
  }, []);

  const clearSession = useCallback(() => {
    clearTenantAuthStorage();
    setUser(null);
    setCartUserId(null);
  }, []);

  useEffect(() => {
    applyTenantSlug();
  }, [applyTenantSlug]);

  useEffect(() => {
    const initAuth = async () => {
      applyTenantSlug();
      try {
        const data = await authService.checkAuth();
        if (data.authenticated && data.user) {
          if (!userMatchesActiveTenant(data.user)) {
            clearSession();
          } else {
            setUser(data.user);
            setCartUserId(data.user.id);
            if (data.user.company?.slug) {
              setActiveTenantSlug(data.user.company.slug);
            }
          }
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [applyTenantSlug, clearSession]);

  const login = (data: { user: User; access: string; refresh: string }) => {
    if (!data?.user) {
      throw new Error("Invalid login response: user data missing");
    }

    const activeTenant = getActiveTenantSlug();
    if (activeTenant && !userMatchesActiveTenant(data.user)) {
      throw new Error(
        data.user?.company
          ? `This account belongs to ${data.user.company.name}. Use ${data.user.company.slug}.localhost:3000/signin`
          : "This account cannot access this store."
      );
    }
    authService.saveTokens(data.access, data.refresh);
    if (data.user?.company?.slug) {
      setActiveTenantSlug(data.user.company.slug);
      setTenantSlug(data.user.company.slug);
    }
    setUser(data.user);
    setCartUserId(data.user.id);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, tenantSlug }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
