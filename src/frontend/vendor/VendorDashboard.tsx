import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { companyService } from "@/api/companyService";
import { type Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Plus, ExternalLink } from "lucide-react";

export default function VendorDashboard() {
  const { user, loading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await companyService.getMyCompanies();
        setCompanies(data);
      }
      setFetching(false);
    }
    if (!loading) loadData();
  }, [user, loading]);

  if (loading || fetching) return <div className="p-8 text-center">Loading dashboard...</div>;

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <h1 className="text-3xl font-bold mb-4">Vendor Dashboard</h1>
        <p className="mb-6">You need to be logged in to access the vendor dashboard.</p>
        <Button asChild><Link to="/signin">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-16 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your companies and store fronts.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/companies/create">
            <Plus className="mr-2 h-4 w-4" /> Add New Company
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.length === 0 ? (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No companies found</h3>
            <p className="text-muted-foreground mt-2 mb-6">You haven't created any companies yet. Start selling by creating your first company profile.</p>
            <Button asChild>
              <Link to="/companies/create">Create Company</Link>
            </Button>
          </div>
        ) : (
          companies.map(company => (
            <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                className="h-32 bg-muted bg-cover bg-center" 
                style={{ backgroundImage: `url(${company.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80'})` }}
              />
              <CardHeader className="relative pb-2">
                <div className="absolute -top-10 left-6 h-16 w-16 bg-background rounded-xl border-4 border-background overflow-hidden flex items-center justify-center">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-6">
                  <CardTitle className="text-xl truncate">{company.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {company.description || "No description provided."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    {company.products?.length || 0} Products
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/companies/${company.slug}`}>
                        <Store className="h-4 w-4 mr-2" /> Profile
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/store/${company.slug}`}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Storefront
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
