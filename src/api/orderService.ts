import axiosInstance from "./axiosConfig";
import { type Order } from "@/types/admin";

export const orderService = {
  async getAll(options?: { status?: string; exclude_status?: string; payment_status?: string }) {
    try {
      const response = await axiosInstance.get("/admin/orders/", {
        params: options
      });
      // Handle potential pagination from DRF
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results as Order[];
      }
      return (Array.isArray(data) ? data : []) as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  async getById(id: string | number) {
    try {
      const response = await axiosInstance.get(`/admin/orders/${id}/`);
      return response.data as Order;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      return null;
    }
  },

  async create(orderData: Partial<Order>) {
    try {
      const response = await axiosInstance.post("/store/orders/create/", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async update(id: string | number, orderData: Partial<Order>) {
    try {
      const response = await axiosInstance.patch(`/admin/orders/${id}/`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  },

  async updateStatus(id: string | number, status: string) {
    try {
      const response = await axiosInstance.patch(`/admin/orders/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  },

  async updatePaymentStatus(id: string | number, paymentStatus: string) {
    try {
      const response = await axiosInstance.patch(`/admin/orders/${id}/`, { paymentStatus });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} payment status:`, error);
      throw error;
    }
  },

  async getByUser() {
    try {
      const response = await axiosInstance.get("/store/orders/my-orders/");
      return response.data as Order[];
    } catch (error) {
      console.error("Error fetching my orders:", error);
      return [];
    }
  },

  async delete(id: string | number) {
    try {
      await axiosInstance.delete(`/admin/orders/${id}/`);
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  }
};
