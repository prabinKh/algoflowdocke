import axiosInstance from "./axiosConfig";

export interface HeroSpec {
  id?: string;
  label: string;
  value: string;
}

export interface HeroContent {
  id?: number;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  specs: HeroSpec[];
}

export const heroService = {
  getSettings: async (options?: { company?: string }): Promise<HeroContent | null> => {
    try {
      const response = await axiosInstance.get("/store/hero-settings/", {
        params: options
      });
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        const hero = data[0];
        return {
          id: hero.id,
          title: hero.title,
          subtitle: hero.subtitle || "",
          description: hero.description || "",
          image: hero.image,
          link: hero.link || "/shop",
          buttonText: hero.buttonText || "Explore Catalog",
          specs: hero.specs || []
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching hero settings:", error);
      return null;
    }
  },

  updateSettings: async (data: HeroContent): Promise<void> => {
    try {
      await axiosInstance.post("/admin/hero-settings/", data);
    } catch (error) {
      console.error("Error updating hero settings:", error);
      throw error;
    }
  }
};
