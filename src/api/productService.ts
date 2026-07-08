import axiosInstance from "./axiosConfig";
import { type Product } from "@/lib/types";

export const productService = {
  async getAll(options?: { company?: string }) {
    try {
      const response = await axiosInstance.get("/store/products/", {
        params: options
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return data as Product[];
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as Record<string, unknown>).results)) {
        return (data as Record<string, unknown>).results as Product[];
      }
      return [] as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await axiosInstance.get(`/store/products/${slug}/`);
      return response.data as Product;
    } catch (error) {
      console.error(`Error fetching product ${slug}:`, error);
      return null;
    }
  },

  async getById(id: string | number) {
    try {
      const response = await axiosInstance.get(`/admin/products/${id}/`);
      return response.data as Product;
    } catch (error) {
      console.error(`Error fetching product ID ${id}:`, error);
      return null;
    }
  },

  async getByCategory(categorySlug: string, options?: { company?: string }) {
    try {
      const response = await axiosInstance.get("/store/products/", {
        params: {
          category: categorySlug,
          ...options
        }
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return data as Product[];
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as Record<string, unknown>).results)) {
        return (data as Record<string, unknown>).results as Product[];
      }
      return [] as Product[];
    } catch (error) {
      console.error(`Error fetching products for category ${categorySlug}:`, error);
      return [];
    }
  },

  // Admin methods
  async create(productData: Partial<Product>) {
    try {
      const response = await axiosInstance.post("/admin/products/", productData);
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  async update(id: string | number, productData: Partial<Product>) {
    try {
      const response = await axiosInstance.patch(`/admin/products/${id}/`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string | number) {
    try {
      await axiosInstance.delete(`/admin/products/${id}/`);
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }
};
