/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HelmetProvider, Helmet } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BrandPage from "./frontend/BrandPage";
import Index from "./frontend/Index";
import CategoryPage from "./frontend/CategoryPage";
import ProductDetailPage from "./frontend/ProductDetailPage";
import CheckoutPage from "./frontend/CheckoutPage";
import ComparePage from "./frontend/ComparePage";
import SearchPage from "./frontend/SearchPage";
import SignInPage from "./login/SignInPage";
import SignUpPage from "./login/SignUpPage";
import StoreLocationsPage from "./frontend/StoreLocationsPage";
import WishlistPage from "./frontend/WishlistPage";
import RequirementFinder from "./frontend/RequirementFinder";
import AdminDashboard from "./admin/Dashboard";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/EditProduct";
import CategoryFeatures from "./admin/CategoryFeatures";
import AdminOrders from "./admin/Orders";
import NewOrders from "./admin/orders/NewOrders";
import PendingOrders from "./admin/orders/PendingOrders";
import ProcessingOrders from "./admin/orders/ProcessingOrders";
import ShippedOrders from "./admin/orders/ShippedOrders";
import DeliveredOrders from "./admin/orders/DeliveredOrders";
import CancelledOrders from "./admin/orders/CancelledOrders";
import ProcessConformOrders from "./admin/orders/ProcessConformOrders";
import ProcessDontConformOrders from "./admin/orders/ProcessDontConformOrders";
import AdminCustomers from "./admin/Customers";
import AdminProducts from "./admin/Products";
import AdminActivity from "./admin/UserActivity";
import UserActivityDetail from "./admin/UserActivityDetail";
import AdminPOS from "./admin/POS";
import AdminPOSHistory from "./admin/POSHistory";
import CustomerReports from "./admin/reports/CustomerReports";
import SalesReport from "./admin/reports/SalesReport";
import SalesProductReport from "./admin/reports/SalesProductReport";
import SalesCategoryReport from "./admin/reports/SalesCategoryReport";
import SalesBrandReport from "./admin/reports/SalesBrandReport";
import OutOfStockReport from "./admin/reports/OutOfStockReport";
import CountryOrderReport from "./admin/reports/CountryOrderReport";
import OrderStatusReport from "./admin/reports/OrderStatusReport";
import TopSalesReports from "./admin/reports/TopSalesReports";
import StockReport from "./admin/reports/StockReport";
import AdminUsers from "./admin/staff/Users";
import AdminRoles from "./admin/staff/Roles";
import AdminServiceTickets from "./admin/ServiceTickets";
import ServiceTicketDetail from "./admin/ServiceTicketDetail";
import ServiceCategories from "./admin/ServiceCategories";
import ServiceCategoryForm from "./admin/ServiceCategoryForm";
import ServiceSubmissions from "./admin/ServiceSubmissions";
import Repairs from "./admin/Repairs";
import AdminMessages from "./admin/Messages";
import HeroSettings from "./admin/HeroSettings";
import ServiceCenterSettings from "./admin/ServiceCenterSettings";
import RepairProducts from "./admin/pages/RepairProducts";
import RepairProductForm from "./admin/pages/RepairProductForm";
import FooterSettings from "./admin/FooterSettings";
import AdminCompanySettings from "./admin/CompanySettings";
import AdminLayout from "./admin/components/AdminLayout";
import OrderSuccessPage from "./frontend/OrderSuccessPage";
import TrackOrdersPage from "./frontend/TrackOrdersPage";
import ServiceCenterPage from "./frontend/ServiceCenterPage";
import HistoryPage from "./frontend/customer/History";
import NotFound from "./frontend/NotFound";
import { ChatWidget } from "@/components/ChatWidget";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import VendorDashboard from "./frontend/vendor/VendorDashboard";
import CreateCompany from "./frontend/company/CreateCompany";
import CompanyProfile from "./frontend/company/CompanyProfile";
import CompanyList from "./frontend/company/CompanyList";
import StoreFront from "./frontend/StoreFront";
import { StoreProvider } from "./frontend/context/StoreContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopOnMount } from "@/components/ScrollToTopOnMount";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { useTracking } from "@/hooks/useTracking";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { customerService } from "@/api/customerService";

function getSafeLocalStorage() {
  try {
    const test = "__storage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch (e) {
    console.warn("localStorage not available, using mock storage");
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
      clear: () => null,
      key: () => null,
      length: 0,
    } as unknown as Storage;
  }
}

const safeStorage = getSafeLocalStorage();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: safeStorage,
});

function AppContent() {
  useTracking();
  const { user } = useAuth();
  
  useEffect(() => {
    const trackVisit = async () => {
      if (user) {
        try {
          // This will create the customer if they don't exist, or update their last visit
          await customerService.getById(user.id, user.email);
        } catch (error) {
          console.error("Error tracking user visit:", error);
        }
      }
    };
    trackVisit();
  }, [user]);

  return (
    <>
      <ScrollToTopOnMount />
      <Routes>
        <Route path="/" element={<Index />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/brand/:slug" element={<BrandPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />
      <Route path="/store/:company_slug/*" element={<StoreFront />} />
      <Route path="/companies" element={<CompanyList />} />
      <Route path="/companies/create" element={<CreateCompany />} />
      <Route path="/companies/:slug" element={<CompanyProfile />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/stores" element={<StoreLocationsPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/requirement-finder" element={<RequirementFinder />} />
      <Route path="/track-orders" element={<TrackOrdersPage />} />
      <Route path="/service-center" element={<ServiceCenterPage />} />
      <Route path="/customer/history" element={<HistoryPage />} />
      
      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<NewOrders />} />
        <Route path="/admin/orders/pending" element={<PendingOrders />} />
        <Route path="/admin/orders/processing" element={<ProcessingOrders />} />
        <Route path="/admin/orders/shipped" element={<ShippedOrders />} />
        <Route path="/admin/orders/delivered" element={<DeliveredOrders />} />
        <Route path="/admin/orders/cancelled" element={<CancelledOrders />} />
        <Route path="/admin/orders/process-conform" element={<ProcessConformOrders />} />
        <Route path="/admin/orders/process-dont-conform" element={<ProcessDontConformOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/edit/:id" element={<EditProduct />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/service-submissions" element={<ServiceSubmissions />} />
        <Route path="/admin/service-submissions/new" element={<ServiceSubmissions title="New Requests" defaultStatus="new" />} />
        <Route path="/admin/service-submissions/active" element={<ServiceSubmissions title="Repair Process" defaultStatus="in_progress" />} />
        <Route path="/admin/service-submissions/done" element={<ServiceSubmissions title="Completed Repaired" defaultStatus="completed" />} />
        <Route path="/admin/service-submissions/rejected" element={<ServiceSubmissions title="Rejected Applications" defaultStatus="cancelled" />} />
        <Route path="/admin/service-categories" element={<ServiceCategories />} />
        <Route path="/admin/service-categories/add" element={<ServiceCategoryForm />} />
        <Route path="/admin/service-categories/:id/edit" element={<ServiceCategoryForm />} />
        <Route path="/admin/service-tickets" element={<AdminServiceTickets />} />
        <Route path="/admin/service-tickets/:id" element={<ServiceTicketDetail />} />
        <Route path="/admin/repairs" element={<Repairs />} />
        <Route path="/admin/repair-products" element={<RepairProducts />} />
        <Route path="/admin/repair-products/add" element={<RepairProductForm />} />
        <Route path="/admin/repair-products/:id/edit" element={<RepairProductForm />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/hero-settings" element={<HeroSettings />} />
        <Route path="/admin/service-center-settings" element={<ServiceCenterSettings />} />
        <Route path="/admin/footer" element={<FooterSettings />} />
        <Route path="/admin/company-settings" element={<AdminCompanySettings />} />
        <Route path="/admin/activity" element={<AdminActivity />} />
        <Route path="/admin/activity/user/:uid" element={<UserActivityDetail />} />
        <Route path="/admin/category-features" element={<CategoryFeatures />} />
        <Route path="/admin/pos" element={<AdminPOS />} />
        <Route path="/admin/pos/history" element={<AdminPOSHistory />} />
        
        {/* Report Routes */}
        <Route path="/admin/reports/customers" element={<CustomerReports />} />
        <Route path="/admin/reports/orders/sales" element={<SalesReport />} />
        <Route path="/admin/reports/orders/products" element={<SalesProductReport />} />
        <Route path="/admin/reports/orders/categories" element={<SalesCategoryReport />} />
        <Route path="/admin/reports/orders/brands" element={<SalesBrandReport />} />
        <Route path="/admin/reports/orders/out-of-stock" element={<OutOfStockReport />} />
        <Route path="/admin/reports/orders/countries" element={<CountryOrderReport />} />
        <Route path="/admin/reports/orders/status" element={<OrderStatusReport />} />
        <Route path="/admin/reports/top-sales" element={<TopSalesReports />} />
        <Route path="/admin/reports/stock" element={<StockReport />} />
        
        {/* Staff Routes */}
        <Route path="/admin/staff/users" element={<AdminUsers />} />
        <Route path="/admin/staff/roles" element={<AdminRoles />} />
      </Route>
      
      <Route path="/admin/add-product" element={<Navigate to="/admin/products/add" replace />} />
      
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  console.log("App component rendering...");
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="system" storageKey="fixitall-theme">
          <AuthProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister }}
            >
              <TooltipProvider>
                <Toaster />
                <ToastToaster />
                <ScrollProgressBar />
                <ScrollToTop />
                <Router>
                  <Helmet>
                    <title>FixItAll | Professional Electronics Repair & Store</title>
                    <meta name="description" content="Expert repair services for laptops, mobiles, and more. Shop the latest electronics with professional support." />
                    <meta property="og:title" content="FixItAll | Professional Electronics Repair & Store" />
                    <meta property="og:description" content="Expert repair services for laptops, mobiles, and more. Shop the latest electronics with professional support." />
                    <meta property="og:type" content="website" />
                    <meta name="twitter:card" content="summary_large_image" />
                  </Helmet>
                  <ChatWidget />
                  <StoreProvider>
                    <AppContent />
                  </StoreProvider>
                </Router>
              </TooltipProvider>
            </PersistQueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
