import axiosInstance from "./axiosConfig";

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  categories?: unknown[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const brandService = {
  // Public endpoints
  async getAll(categorySlug?: string, options?: { company?: string }) {
    try {
      const response = await axiosInstance.get("/store/brands/", {
        params: {
          category: categorySlug,
          ...options
        }
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return data as Brand[];
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as Record<string, unknown>).results)) {
        return (data as Record<string, unknown>).results as Brand[];
      }
      return [] as Brand[];
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await axiosInstance.get(`/store/brands/${slug}/`);
      return response.data as Brand;
    } catch (error) {
      console.error(`Error fetching brand ${slug}:`, error);
      return null;
    }
  },

  // Admin endpoints
  async createBrand(data: Partial<Brand>) {
    try {
      const response = await axiosInstance.post("/admin/brands/", data);
      return response.data as Brand;
    } catch (error) {
      console.error("Error creating brand:", error);
      throw error;
    }
  },

  async updateBrand(slug: string, data: Partial<Brand>) {
    try {
      const response = await axiosInstance.patch(`/admin/brands/${slug}/`, data);
      return response.data as Brand;
    } catch (error) {
      console.error("Error updating brand:", error);
      throw error;
    }
  },

  async deleteBrand(slug: string) {
    try {
      await axiosInstance.delete(`/admin/brands/${slug}/`);
      return true;
    } catch (error) {
      console.error("Error deleting brand:", error);
      throw error;
    }
  },

  async getAllAdmin(search?: string) {
    try {
      const response = await axiosInstance.get("/admin/brands/", {
        params: search ? { search } : {}
      });
      return response.data as Brand[];
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },
};
