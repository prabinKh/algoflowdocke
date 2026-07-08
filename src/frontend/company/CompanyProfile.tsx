import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { companyService } from "@/api/companyService";
import { type Company } from "@/lib/types";
import { MapPin, Globe, Phone, Mail, Store, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/frontend/components/ProductCard";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";

export default function CompanyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (slug) {
        const data = await companyService.getBySlug(slug);
        setCompany(data);
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-xl">Loading company profile...</div>;

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Store className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">The company you are looking for does not exist or has been removed.</p>
          <Button asChild><Link to="/companies">Browse Companies</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-20">
        {/* Banner Section */}
        <div 
          className="w-full h-64 md:h-80 bg-muted relative"
          style={{ 
            backgroundImage: `url(${company.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="container mx-auto px-4 relative h-full flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-white text-center md:text-left">
              <div className="h-32 w-32 md:h-40 md:w-40 bg-white rounded-2xl border-4 border-background overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xl">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 mb-2">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">{company.name}</h1>
                <p className="text-lg opacity-90 mt-2 font-medium">Owned by {company.owner_name}</p>
              </div>
              <div className="flex gap-3 mb-2">
                <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(currentUrl)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share URL
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 pb-2 border-b">About Us</h3>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed mb-6">
                {company.description || "No description provided."}
              </p>
              
              <div className="space-y-4">
                {company.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href={`tel:${company.phone}`} className="hover:underline">{company.phone}</a>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href={`mailto:${company.email}`} className="hover:underline break-all">{company.email}</a>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
                Member since {new Date(company.created_at || '').toLocaleDateString()}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg break-all text-xs border text-center">
                <span className="font-semibold block mb-1">Company URL:</span>
                {currentUrl}
              </div>
            </div>
          </div>

          {/* Main Content (Products & Gallery) */}
          <div className="lg:col-span-3 space-y-10">
            
            {/* Gallery Section */}
            {company.gallery_images && company.gallery_images.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3">📸</span> 
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {company.gallery_images.map(img => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                      <img src={img.image} alt="Gallery item" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3">📦</span> 
                  Products from {company.name}
                </h2>
                <span className="text-muted-foreground text-sm font-medium bg-muted px-3 py-1 rounded-full">
                  {company.products?.length || 0} Items
                </span>
              </div>
              
              {(!company.products || company.products.length === 0) ? (
                <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
                  <p className="text-muted-foreground text-lg">This company hasn't listed any products yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {company.products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
