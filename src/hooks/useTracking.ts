import { useEffect, useRef } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { userActivityService } from "@/api/userActivityService";

export const useTracking = () => {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const { user } = useAuth();

  useEffect(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;

    let pageType = "general";
    let metadata: Record<string, string | undefined> = {};

    const productMatch = matchPath("/product/:slug", location.pathname);
    const categoryMatch = matchPath("/category/:slug", location.pathname);

    if (location.pathname === "/") {
      pageType = "home";
    } else if (productMatch) {
      pageType = "view_product";
      metadata = {
        productSlug: productMatch.params.slug,
      };
    } else if (categoryMatch) {
      pageType = "view_category";
      const searchParams = new URLSearchParams(location.search);
      const brands = searchParams.getAll("brand");
      metadata = {
        categorySlug: categoryMatch.params.slug,
        brands: brands.length > 0 ? brands.join(", ") : undefined,
        minPrice: searchParams.get("minPrice") || undefined,
        maxPrice: searchParams.get("maxPrice") || undefined,
        sortBy: searchParams.get("sort") || undefined,
      };
    } else if (location.pathname === "/checkout") {
      pageType = "view_checkout";
    } else if (location.pathname === "/search") {
      pageType = "search";
      const searchParams = new URLSearchParams(location.search);
      metadata = { query: searchParams.get("q") || undefined };
    } else if (location.pathname === "/compare") {
      pageType = "view_compare";
    } else if (location.pathname === "/wishlist") {
      pageType = "view_wishlist";
    } else {
      pageType = "view_page";
    }

    const logActivity = async (duration: number) => {
      // Filter out undefined values from metadata
      const cleanMetadata = Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined)
      );

      try {
        await userActivityService.log({
          uid: user?.id || "anonymous",
          email: user?.email || "anonymous",
          pageType,
          path: location.pathname,
          metadata: cleanMetadata,
          duration: Math.round(duration / 1000), // in seconds
        });
      } catch (error) {
        console.error("Error logging activity:", error);
      }
    };

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      // Only log if spent more than 1 second on the page
      if (duration > 1000) {
        logActivity(duration);
      }
    };
  }, [location.pathname, location.search, user]);
};
