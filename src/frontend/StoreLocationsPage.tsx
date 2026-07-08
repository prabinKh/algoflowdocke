import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { MapPin, Phone, Clock } from "lucide-react";
import { useStore } from "@/frontend/context/StoreContext";

const StoreLocationsPage = () => {
  const { company } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  const locations = company?.store_locations?.filter(l => l.is_active) || [];
  const hours = company?.footer_settings ? 
    `${company.footer_settings.opening_hours_weekday} | ${company.footer_settings.opening_hours_weekend}` : 
    "Sun-Fri: 10AM-7:30PM";

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Header />
      <main className="neo-container py-12">
        <h1 className="text-2xl font-display font-bold mb-8 gsap-reveal">
          {company?.footer_settings?.location_title || "Our Store Locations"}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length > 0 ? (
            locations.map((loc, i) => (
              <div key={i} className="p-6 bg-card border border-border rounded-2xl space-y-3 gsap-reveal hover:border-primary/50 transition-colors shadow-sm">
                <h2 className="font-display font-semibold text-lg">{loc.name}</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed">{loc.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-primary" />
                    <span className="font-mono">{loc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    <span>{hours}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-muted-foreground/50 gsap-reveal">
              No store locations available at the moment.
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default StoreLocationsPage;
