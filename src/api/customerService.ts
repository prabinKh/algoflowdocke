import axiosInstance from "./axiosConfig";
import { type Customer } from "@/types/admin";

export const customerService = {
  async getAll() {
    try {
      const response = await axiosInstance.get("/admin/customers/");
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results as Customer[];
      }
      return (Array.isArray(data) ? data : []) as Customer[];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },

  async getById(id: string | number, email?: string | null) {
    try {
      const response = await axiosInstance.get(`/admin/customers/${id}/`, {
        params: email ? { email } : {}
      });
      return response.data as Customer;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      return null;
    }
  },

  async update(id: string | number, customerData: Partial<Customer>) {
    try {
      const response = await axiosInstance.patch(`/admin/customers/${id}/`, customerData);
      return response.data;
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      throw error;
    }
  },

  async updateCart(userId: string | number, cartItems: unknown[]) {
    try {
      const response = await axiosInstance.post(`/admin/customers/${userId}/sync_cart/`, { cartItems });
      return response.data;
    } catch (error) {
      console.error(`Error syncing cart for user ${userId}:`, error);
      throw error;
    }
  },

  async clearCart(userId: string | number) {
    try {
      const response = await axiosInstance.post(`/admin/customers/${userId}/sync_cart/`, { cartItems: [] });
      return response.data;
    } catch (error) {
      console.error(`Error clearing cart for user ${userId}:`, error);
      throw error;
    }
  },

  async syncWishlist(userId: string | number, wishlistItems: unknown[]) {
    try {
      const response = await axiosInstance.post(`/admin/customers/${userId}/sync_wishlist/`, { wishlistItems });
      return response.data;
    } catch (error) {
      console.error(`Error syncing wishlist for user ${userId}:`, error);
      throw error;
    }
  },

  async delete(id: string | number) {
    try {
      await axiosInstance.delete(`/admin/customers/${id}/`);
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      throw error;
    }
  }
};
