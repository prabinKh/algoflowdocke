export function normalizeApiUrl(url: string): string {
  if (!url) return url;

  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url;
  }

  if (
    url.startsWith('/api/') ||
    url.startsWith('/django-admin/') ||
    url.startsWith('/static/') ||
    url.startsWith('/media/')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `/api${url}`;
  }

  return url;
}
