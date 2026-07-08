import axiosInstance from "./axiosConfig";

export interface UserActivity {
  id?: string | number;
  uid: string | null;
  email: string | null;
  displayName?: string;
  pageType: string;
  path: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
  userAgent: string;
  screenResolution: string;
  ipAddress?: string;
}

export const userActivityService = {
  log: async (activity: Omit<UserActivity, "timestamp" | "userAgent" | "screenResolution">) => {
    try {
      const fullActivity = {
        ...activity,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };
      const response = await axiosInstance.post("/admin/activity/", fullActivity);
      return response.data;
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  },

  track: async (action: string, metadata: Record<string, unknown> = {}, path?: string) => {
    try {
      const response = await axiosInstance.post("/admin/activity/", {
        action,
        path: path || window.location.pathname,
        metadata,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        duration: 0,
      });
      return response.data;
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  },

  async getAll() {
    try {
      const response = await axiosInstance.get("/admin/activity/");
      return response.data as UserActivity[];
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  },

  async getByUser(userId: string | number) {
    try {
      const response = await axiosInstance.get("/admin/activity/", {
        params: { uid: userId }
      });
      return response.data as UserActivity[];
    } catch (error) {
      console.error(`Error fetching activities for user ${userId}:`, error);
      return [];
    }
  },
};
