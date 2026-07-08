import axiosInstance from "./axiosConfig";
import { handleApiError } from "./utils";

export const uploadService = {
  uploadImage: async (file: File | Blob, path: string): Promise<string> => {
    try {
      const formData = new FormData();
      // Use original file name if it's a File object, otherwise fallback to path logic
      const fileName = (file instanceof File) ? file.name : (path.split('/').pop() || 'upload');
      formData.append("file", file, fileName);
      formData.append("path", path);

      const response = await axiosInstance.post("/admin/upload/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  uploadModel: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("/admin/upload-model/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
