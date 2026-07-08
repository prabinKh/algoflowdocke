import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, MemoryStick, HardDrive, Monitor } from "lucide-react";
import { CachedImage } from "@/components/ui/cached-image";
import { heroService, type HeroContent, type HeroSpec } from "@/api/heroService";
import { useStore } from "@/frontend/context/StoreContext";

const defaultHero: HeroContent = {
  title: "Precision Tools for Modern Workflow",
  description: "Powering performance, built for every ambition. Explore our curated collection of premium electronics.",
  image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
  specs: [
    { label: "Processor", value: "Intel® Core™ i5" },
    { label: "RAM", value: "8 GB DDR5" },
    { label: "Storage", value: "512 GB SSD" }
  ]
};

export const HeroBanner = () => {
  const [content, setContent] = useState<HeroContent>(defaultHero);
  const { companySlug } = useStore();

  useEffect(() => {
    const fetchHero = async () => {
      const data = await heroService.getSettings({ company: companySlug });
      if (data) {
        setContent(data);
      }
    };
    fetchHero();
  }, [companySlug]);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-outer)] bg-gradient-to-br from-foreground to-primary/20 text-background min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] flex items-center">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 sm:gap-10 p-6 sm:p-10 lg:p-16 w-full">
        <div className="flex-1 space-y-5 sm:space-y-7 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary-foreground mx-auto lg:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            New Tech Arrival
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold tracking-tighter leading-[1.1] whitespace-pre-line">
            {content.title}
          </h1>
          <p className="text-background/70 text-sm sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {content.description || content.subtitle}
          </p>
          
          <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-10 pt-2 flex-wrap">
            {(content.specs || []).map((spec, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Monitor size={18} className="text-primary-foreground sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-background/40 font-bold">{spec.label}</p>
                  <p className="text-xs sm:text-sm font-bold">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              to={content.link || "/category/all"}
              className="btn-primary group"
            >
              {content.buttonText || "Explore Catalog"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="flex-1 flex justify-center w-full lg:w-auto">
          <div className="relative group">
            <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[80px] opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
            <div className="relative bg-gradient-to-br from-white/5 to-transparent p-4 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
              <CachedImage
                src={content.image}
                alt="Featured product"
                className="w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[500px] object-contain rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-700 hero-parallax-img"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corner gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
};
