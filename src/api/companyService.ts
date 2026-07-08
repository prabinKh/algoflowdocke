import { type Company } from "@/lib/types";
import axiosInstance from "./axiosConfig";

export const companyService = {
  async getAll() {
    try {
      const response = await axiosInstance.get("/companies/");
      return response.data as Company[];
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await axiosInstance.get(`/companies/${slug}/`);
      return response.data as Company;
    } catch (error) {
      console.error(`Error fetching company ${slug}:`, error);
      return null;
    }
  },

  async getCurrentCompany() {
    try {
      const response = await axiosInstance.get("/store/current-company/");
      return response.data as Company;
    } catch (error) {
      console.error("Error fetching current company:", error);
      return null;
    }
  },

  async getMyCompanies() {
    try {
      const response = await axiosInstance.get("/companies/my_companies/");
      return response.data as Company[];
    } catch (error) {
      console.error("Error fetching my companies:", error);
      return [];
    }
  },

  async create(companyData: Partial<Company> & { uploaded_images?: string[] }) {
    try {
      const response = await axiosInstance.post("/companies/", companyData);
      return response.data as Company;
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  },

  async update(slug: string, companyData: Partial<Company> & { uploaded_images?: string[] }) {
    try {
      const response = await axiosInstance.patch(`/companies/${slug}/`, companyData);
      return response.data as Company;
    } catch (error) {
      console.error(`Error updating company ${slug}:`, error);
      throw error;
    }
  }
};
