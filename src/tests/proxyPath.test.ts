import { describe, it, expect } from 'vitest';
import { normalizeApiUrl } from '../api/apiUrl';

describe('normalizeApiUrl', () => {
  it('preserves the mounted API prefix for Django routes', () => {
    expect(normalizeApiUrl('/account/login/')).toBe('/api/account/login/');
  });

  it('preserves the mounted admin prefix for Django admin routes', () => {
    expect(normalizeApiUrl('/django-admin/auth/login/')).toBe('/django-admin/auth/login/');
  });
});
