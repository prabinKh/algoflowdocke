import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './productService';
import axiosInstance from './axiosConfig';

vi.mock('./axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll should fetch and return products', async () => {
    const mockProducts = [{ id: 1, name: 'Test Product' }];
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockProducts });

    const result = await productService.getAll();
    expect(axiosInstance.get).toHaveBeenCalledWith('/store/products/', { params: undefined });
    expect(result).toEqual(mockProducts);
  });

  it('getAll should return empty array on failure', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(new Error('Fetch failed'));

    const result = await productService.getAll();
    expect(result).toEqual([]);
  });

  it('getBySlug should return product', async () => {
    const mockProduct = { id: 1, name: 'Test', slug: 'test' };
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockProduct });

    const result = await productService.getBySlug('test');
    expect(axiosInstance.get).toHaveBeenCalledWith('/store/products/test/');
    expect(result).toEqual(mockProduct);
  });
});
