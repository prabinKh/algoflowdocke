import axiosInstance from "./axiosConfig";
import { RepairProduct, RepairBrand, RepairIssue, ServiceCategory, ServiceBrand } from "../types/repair";

export interface ServiceableItem {
  id: string;
  name: string;
  type: 'category' | 'brand';
  company: string;
}

export const serviceCenterSettingsService = {
  async getAll(companySlug: string) {
    try {
      const response = await axiosInstance.get(`/admin/service-center-settings/`, { params: { company: companySlug } });
      return response.data as ServiceableItem[];
    } catch (error) {
      console.error("Error fetching service center settings:", error);
      return [];
    }
  },
  async create(companySlug: string, item: Omit<ServiceableItem, 'id'>) {
    try {
      const response = await axiosInstance.post('/admin/service-center-settings/', { ...item, company: companySlug });
      return response.data as ServiceableItem;
    } catch (error) {
      console.error("Error creating service center setting:", error);
      throw error;
    }
  },
  async delete(companySlug: string, id: string) {
    try {
      await axiosInstance.delete(`/admin/service-center-settings/${id}/`, { params: { company: companySlug } });
      return true;
    } catch (error) {
      console.error(`Error deleting service center setting ${id}:`, error);
      throw error;
    }
  }
};

export const adminServiceCategoryService = {
  async getAll() {
    try {
      const response = await axiosInstance.get('/admin/service-categories/');
      return response.data as ServiceCategory[];
    } catch (error) {
      console.error("Error fetching admin service categories:", error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const response = await axiosInstance.get(`/admin/service-categories/${id}/`);
      return response.data as ServiceCategory;
    } catch (error) {
      console.error(`Error fetching admin service category ${id}:`, error);
      throw error;
    }
  },

  async create(category: Partial<ServiceCategory>) {
    try {
      const response = await axiosInstance.post('/admin/service-categories/', category);
      return response.data as ServiceCategory;
    } catch (error) {
      console.error("Error creating admin service category:", error);
      throw error;
    }
  },

  async update(id: string, category: Partial<ServiceCategory>) {
    try {
      const response = await axiosInstance.put(`/admin/service-categories/${id}/`, category);
      return response.data as ServiceCategory;
    } catch (error) {
      console.error(`Error updating admin service category ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await axiosInstance.delete(`/admin/service-categories/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting admin service category ${id}:`, error);
      throw error;
    }
  }
};

export const repairProductService = {
  async getAll(params?: { search?: string; category?: string; company?: string }) {
    try {
      const response = await axiosInstance.get('/admin/repair-products/', { params });
      return response.data as RepairProduct[];
    } catch (error) {
      console.error("Error fetching repair products:", error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const response = await axiosInstance.get(`/admin/repair-products/${id}/`);
      return response.data as RepairProduct;
    } catch (error) {
      console.error(`Error fetching repair product ${id}:`, error);
      throw error;
    }
  },

  async create(product: Partial<RepairProduct>) {
    try {
      const response = await axiosInstance.post('/admin/repair-products/', product);
      return response.data as RepairProduct;
    } catch (error) {
      console.error("Error creating repair product:", error);
      throw error;
    }
  },

  async update(id: string, product: Partial<RepairProduct>) {
    try {
      const response = await axiosInstance.put(`/admin/repair-products/${id}/`, product);
      return response.data as RepairProduct;
    } catch (error) {
      console.error(`Error updating repair product ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await axiosInstance.delete(`/admin/repair-products/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting repair product ${id}:`, error);
      throw error;
    }
  },

  async patchStatus(id: string, status: 'active' | 'inactive') {
    try {
      const response = await axiosInstance.patch(`/admin/repair-products/${id}/status/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error patching status for product ${id}:`, error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await axiosInstance.get('/admin/repair-products/stats/');
      return response.data;
    } catch (error) {
      console.error("Error fetching repair stats:", error);
      return { total_products: 0, active_products: 0, inactive_products: 0, total_brands: 0 };
    }
  },

  // Brands
  async addBrand(productId: string, brand: Partial<RepairBrand>) {
    try {
      const response = await axiosInstance.post('/admin/repair-brands/', { ...brand, product: productId });
      return response.data as RepairBrand;
    } catch (error) {
      console.error("Error adding brand:", error);
      throw error;
    }
  },

  async deleteBrand(id: string) {
    try {
      await axiosInstance.delete(`/admin/repair-brands/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting brand ${id}:`, error);
      throw error;
    }
  },

  // Issues
  async addIssue(productId: string, issue: Partial<RepairIssue>) {
    try {
      const response = await axiosInstance.post('/admin/repair-issues/', { ...issue, product: productId });
      return response.data as RepairIssue;
    } catch (error) {
      console.error("Error adding issue:", error);
      throw error;
    }
  },

  async deleteIssue(id: string) {
    try {
      await axiosInstance.delete(`/admin/repair-issues/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting issue ${id}:`, error);
      throw error;
    }
  }
};
