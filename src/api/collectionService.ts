import axiosInstance from "./axiosConfig";

export interface Collection {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const collectionService = {
  async getAll() {
    try {
      const response = await axiosInstance.get("/admin/collections/");
      return response.data as Collection[];
    } catch (error) {
      console.error("Error fetching collections:", error);
      return [];
    }
  },

  async getAllPublic() {
    try {
      const response = await axiosInstance.get("/store/collections/");
      return response.data as Collection[];
    } catch (error) {
      console.error("Error fetching public collections:", error);
      return [];
    }
  },

  async create(name: string) {
    try {
      const response = await axiosInstance.post("/admin/collections/", { 
        name,
        is_active: true 
      });
      return response.data as Collection;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await axiosInstance.delete(`/admin/collections/${id}/`);
    } catch (error) {
      console.error(`Error deleting collection ${id}:`, error);
      throw error;
    }
  }
};
