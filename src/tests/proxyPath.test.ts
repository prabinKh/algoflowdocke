import { describe, it, expect } from 'vitest';
import { normalizeApiUrl } from '../api/apiUrl';

describe('normalizeApiUrl', () => {
  it('keeps relative paths when baseURL already mounts /api', () => {
    expect(normalizeApiUrl('/account/login/', '/api')).toBe('/account/login/');
    expect(normalizeApiUrl('/store/products/', '/api')).toBe('/store/products/');
  });

  it('strips duplicate /api prefix when baseURL already mounts /api', () => {
    expect(normalizeApiUrl('/api/account/login/', '/api')).toBe('/account/login/');
  });

  it('adds /api prefix for direct Django host base URLs', () => {
    expect(normalizeApiUrl('/account/login/', 'http://127.0.0.1:8001')).toBe(
      '/api/account/login/'
    );
  });

  it('preserves the mounted admin prefix for Django admin routes', () => {
    expect(normalizeApiUrl('/django-admin/auth/login/')).toBe('/django-admin/auth/login/');
  });
});
