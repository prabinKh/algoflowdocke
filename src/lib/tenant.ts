import type { User } from "@/context/AuthContext";

/** Subdomain slug from daraz.localhost */
export function getTenantSlugFromHost(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 1 && parts[parts.length - 1] === "localhost") {
    const sub = parts[0];
    if (sub && sub !== "www" && sub !== "localhost") {
      return sub;
    }
  }
  return null;
}

/** Active tenant: subdomain first, then stored slug from store context */
export function getActiveTenantSlug(): string | null {
  return getTenantSlugFromHost() || localStorage.getItem("current_company_slug");
}

export function setActiveTenantSlug(slug: string) {
  localStorage.setItem("current_company_slug", slug);
}

export function tenantStorageKey(key: string): string {
  const slug = getActiveTenantSlug() || "platform";
  return `${slug}:${key}`;
}

export function getTenantHeaders(): Record<string, string> {
  const slug = getActiveTenantSlug();
  const headers: Record<string, string> = {};
  if (slug) {
    headers["X-Company-Slug"] = slug;
  }
  return headers;
}

export function userMatchesActiveTenant(user: User | null): boolean {
  if (!user) return false;
  const tenant = getActiveTenantSlug();
  if (!tenant) return true;
  if (user.is_superuser || user.role === "superadmin") return true;
  return user.company?.slug === tenant;
}

export function clearTenantAuthStorage() {
  const slug = getActiveTenantSlug() || "platform";
  localStorage.removeItem(`${slug}:access_token`);
  localStorage.removeItem(`${slug}:refresh_token`);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
