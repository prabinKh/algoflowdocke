import axiosInstance from "./axiosConfig";

export interface StaffRole {
  id: string | number;
  name: string;
  permissions: string[];
}

export interface StaffMember {
  id: string | number;
  user: string; // User ID
  role: string | number; // Role ID
  user_details?: {
    id: string;
    email: string;
    name: string;
  };
  role_details?: StaffRole;
}

export const staffService = {
  async getRoles(): Promise<StaffRole[]> {
    const response = await axiosInstance.get("/admin/staff-roles/");
    return response.data;
  },

  async getMembers(): Promise<StaffMember[]> {
    const response = await axiosInstance.get("/admin/staff-members/");
    return response.data;
  },

  async createRole(data: Partial<StaffRole>) {
    const response = await axiosInstance.post("/admin/staff-roles/", data);
    return response.data;
  },

  async updateRole(id: string | number, data: Partial<StaffRole>) {
    const response = await axiosInstance.patch(`/admin/staff-roles/${id}/`, data);
    return response.data;
  },

  async deleteRole(id: string | number) {
    await axiosInstance.delete(`/admin/staff-roles/${id}/`);
  },

  async createMember(data: Partial<StaffMember>) {
    const response = await axiosInstance.post("/admin/staff-members/", data);
    return response.data;
  },

  async updateMember(id: string | number, data: Partial<StaffMember>) {
    const response = await axiosInstance.patch(`/admin/staff-members/${id}/`, data);
    return response.data;
  },

  async deleteMember(id: string | number) {
    await axiosInstance.delete(`/admin/staff-members/${id}/`);
  },
};
