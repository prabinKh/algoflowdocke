/** True when axios baseURL already mounts routes under /api (proxy or relative). */
function baseUrlIncludesApiMount(baseURL: string): boolean {
  if (!baseURL) return false;
  if (baseURL === '/api' || baseURL.endsWith('/api')) return true;
  try {
    const pathname = new URL(baseURL).pathname.replace(/\/$/, '');
    return pathname === '/api' || pathname.endsWith('/api');
  } catch {
    return false;
  }
}

export function normalizeApiUrl(url: string, baseURL = '/api'): string {
  if (!url) return url;

  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url;
  }

  if (
    url.startsWith('/django-admin/') ||
    url.startsWith('/static/') ||
    url.startsWith('/media/')
  ) {
    return url;
  }

  const baseHasApi = baseUrlIncludesApiMount(baseURL);

  // Avoid /api/api/... when axios baseURL is already /api.
  if (baseHasApi && url.startsWith('/api/')) {
    return url.slice(4);
  }

  // Direct Django host (e.g. http://127.0.0.1:8001) needs the /api prefix.
  if (!baseHasApi && url.startsWith('/') && !url.startsWith('/api/')) {
    return `/api${url}`;
  }

  return url;
}
