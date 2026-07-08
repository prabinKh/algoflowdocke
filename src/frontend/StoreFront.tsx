import { useEffect, useState } from "react";
import { useParams, Routes, Route, useNavigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { companyService } from "@/api/companyService";
import { type Company } from "@/lib/types";
import { setActiveTenantSlug } from "@/lib/tenant";

// Import all the pages that should be scoped to a store
import Index from "./Index";
import CategoryPage from "./CategoryPage";
import ProductDetailPage from "./ProductDetailPage";
import SearchPage from "./SearchPage";

export default function StoreFront() {
  const { company_slug } = useParams<{ company_slug: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      if (!company_slug) return;
      try {
        const data = await companyService.getBySlug(company_slug);
        if (!data) {
          navigate('/companies'); // Redirect if not found
          return;
        }
        setCompany(data);
        setActiveTenantSlug(company_slug);
      } catch (error) {
        console.error("Error fetching company store:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [company_slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <StoreProvider companySlug={company_slug} company={company}>
      <div className="vendor-store-theme">
        {/* We can inject custom CSS variables here if the vendor has theme colors */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>
    </StoreProvider>
  );
}
