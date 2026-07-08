import axiosInstance from "./axiosConfig";
import { RepairProduct, RepairRequest, ServiceCategory, ServiceBrand } from "../types/repair";

export const repairService = {
  async getServiceCategories() {
    try {
      const response = await axiosInstance.get('/store/service-categories/');
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results as ServiceCategory[];
      }
      return (Array.isArray(data) ? data : []) as ServiceCategory[];
    } catch (error) {
      console.error("Error fetching service categories:", error);
      return [];
    }
  },

  async getServiceCategory(id: string) {
    try {
      const response = await axiosInstance.get(`/store/service-categories/${id}/`);
      return response.data as ServiceCategory;
    } catch (error) {
      console.error(`Error fetching service category ${id}:`, error);
      throw error;
    }
  },
  async getRepairProducts() {
    try {
      const response = await axiosInstance.get('/store/repair-products/');
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results as RepairProduct[];
      }
      return (Array.isArray(data) ? data : []) as RepairProduct[];
    } catch (error) {
      console.error("Error fetching repair products:", error);
      return [];
    }
  },

  async getRepairProduct(id: string) {
    try {
      const response = await axiosInstance.get(`/store/repair-products/${id}/`);
      return response.data as RepairProduct;
    } catch (error) {
      console.error(`Error fetching repair product ${id}:`, error);
      throw error;
    }
  },

  async submitTicket(data: Partial<RepairRequest>) {
    try {
      const response = await axiosInstance.post('/store/service-tickets/create/', data);
      return response.data;
    } catch (error) {
      console.error("Error submitting ticket:", error);
      throw error;
    }
  },

  async getAll() {
    try {
      const response = await axiosInstance.get('/admin/service-tickets/');
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      return [];
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      const response = await axiosInstance.patch(`/admin/service-tickets/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating ticket ${id} status:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await axiosInstance.delete(`/admin/service-tickets/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting ticket ${id}:`, error);
      throw error;
    }
  },

  async getMyTickets() {
    try {
      const response = await axiosInstance.get('/store/service-tickets/my-tickets/');
      return response.data;
    } catch (error) {
      console.error("Error fetching my tickets:", error);
      return [];
    }
  },

  async trackTicket(ticketId: string) {
    try {
       const response = await axiosInstance.get(`/store/service-tickets/track/${ticketId}/`);
       return response.data;
    } catch (error) {
       console.error("Error tracking ticket:", error);
       throw error;
    }
  }
};
