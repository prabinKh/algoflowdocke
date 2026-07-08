import axiosInstance from "./axiosConfig";
import { safeStorage } from "@/lib/storage";
import {
  tenantStorageKey,
  getActiveTenantSlug,
  setActiveTenantSlug,
} from "@/lib/tenant";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password2: string;
  username?: string;
}

export const authService = {
  getAccessToken(): string | null {
    return (
      safeStorage.getItem(tenantStorageKey("access_token")) ||
      safeStorage.getItem("access_token")
    );
  },

  saveTokens(access: string, refresh: string) {
    safeStorage.setItem(tenantStorageKey("access_token"), access);
    if (refresh) {
      safeStorage.setItem(tenantStorageKey("refresh_token"), refresh);
    }
  },

  register: async (payload: RegisterPayload) => {
    try {
      const response = await axiosInstance.post("/account/register/", payload);
      const data = response.data;
      const slug = getActiveTenantSlug();
      if (slug) setActiveTenantSlug(slug);
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Record<string, string | string[]>, message?: string } } };
      console.error("Registration failed:", err);
      const data = err.response?.data || {};
      if (data.errors) {
        const parts: string[] = [];
        for (const [field, value] of Object.entries(
          data.errors
        )) {
          const list = Array.isArray(value) ? value : [value];
          list.forEach((msg) => parts.push(`${field}: ${msg}`));
        }
        throw new Error(parts.join(" "));
      }
      throw new Error(data.message || "Registration failed");
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/account/login/", { email, password });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Login failed:", err);
      throw new Error(err.response?.data?.message || "Failed to login");
    }
  },

  logout: async () => {
    try {
      const response = await axiosInstance.post("/account/logout/");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Logout failed:", err);
      throw new Error(err.response?.data?.message || "Failed to logout");
    }
  },

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/account/check/");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Not authenticated");
    }
  },
};
