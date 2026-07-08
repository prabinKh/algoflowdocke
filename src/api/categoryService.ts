import axiosInstance from "./axiosConfig";
import { type Category } from "@/lib/types";

export const categoryService = {
  async getAll(options?: { company?: string }) {
    try {
      const response = await axiosInstance.get("/store/categories/", {
        params: options
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return data as Category[];
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as Record<string, unknown>).results)) {
        return (data as Record<string, unknown>).results as Category[];
      }
      return [] as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await axiosInstance.get(`/store/categories/${slug}/`);
      return response.data as Category;
    } catch (error) {
      console.error(`Error fetching category ${slug}:`, error);
      return null;
    }
  },

  async getFeatures(categorySlug: string) {
    try {
      const response = await axiosInstance.get(`/admin/category-features/`);
      const all = response.data;
      return Array.isArray(all) ? all.find((f) => f?.category_slug === categorySlug || f?.categorySlug === categorySlug || f?.category === categorySlug) ?? null : null;
    } catch (error) {
      console.error(`Error fetching features for ${categorySlug}:`, error);
      return null;
    }
  },

  async updateFeatures(categorySlug: string, featureData: Record<string, unknown>) {
    try {
      const payload = {
        ...featureData,
        categorySlug: categorySlug
      };

      const response = await axiosInstance.post("/admin/category-features/", payload);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error updating features for ${categorySlug}:`, error);
      throw error;
    }
  },

  async create(categoryData: Partial<Category>) {
    try {
      const response = await axiosInstance.post("/admin/categories/", categoryData);
      return response.data;
    } catch (error: unknown) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async update(slug: string, categoryData: Partial<Category>) {
    try {
      const response = await axiosInstance.patch(`/admin/categories/${slug}/`, categoryData);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error updating category ${slug}:`, error);
      throw error;
    }
  },

  async delete(slug: string) {
    try {
      await axiosInstance.delete(`/admin/categories/${slug}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting category ${slug}:`, error);
      throw error;
    }
  },

  async getAllFeatures() {
    try {
      const response = await axiosInstance.get("/admin/category-features/");
      return response.data;
    } catch (error) {
      console.error("Error fetching all features:", error);
      return [];
    }
  },

  async deleteFeatures(categorySlug: string) {
    await this.updateFeatures(categorySlug, { features: [] });
  }
};
