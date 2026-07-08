import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { companyService } from "@/api/companyService";
import { type Company } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Store, Building2 } from "lucide-react";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await companyService.getAll();
      setCompanies(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex justify-center items-center gap-3">
            <Building2 className="h-10 w-10 text-primary" /> Our Vendors
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover products from our verified partner companies and independent sellers.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 border-2 border-dashed rounded-xl">
            No companies found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map(company => (
              <Link key={company.id} to={`/store/${company.slug}`} className="group">
                <Card className="overflow-hidden h-full flex flex-col border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                  <div 
                    className="h-40 bg-muted relative"
                    style={{ 
                      backgroundImage: `url(${company.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  <CardHeader className="relative pt-12 pb-2">
                    <div className="absolute -top-12 left-6 h-20 w-20 bg-background rounded-2xl border-4 border-background overflow-hidden flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{company.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 text-sm h-10">
                      {company.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 border-t mt-4 flex justify-between items-center text-sm text-muted-foreground">
                    <span>{company.products?.length || 0} Products</span>
                    <span className="font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Shop &rarr;</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
