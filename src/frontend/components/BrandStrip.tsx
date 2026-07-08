import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { brandService, type Brand } from "@/api/brandService";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/frontend/context/StoreContext";
import { motion } from "motion/react";

export const BrandStrip = () => {
  const { companySlug } = useStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.getAll(undefined, { company: companySlug }).then(data => {
      setBrands(Array.isArray(data) ? data.filter(b => b.is_active !== false) : []);
      setLoading(false);
    });
  }, [companySlug]);

  if (loading) {
    return (
      <section className="py-10 sm:py-16 border-t border-border/50">
        <div className="flex items-center gap-4 mb-8 sm:mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">Authorized Partners</p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-20 flex-wrap px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  // Duplicate brands for seamless infinite loop (at least 3 sets)
  const duplicatedBrands = [...brands, ...brands, ...brands];

  return (
    <section className="py-10 sm:py-16 border-t border-border/50 overflow-hidden relative">
      <div className="flex items-center gap-4 mb-8 sm:mb-12 neo-container">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">Authorized Partners</p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>
      
      <div className="flex overflow-hidden">
        <motion.div 
          className="flex whitespace-nowrap gap-12 sm:gap-16 md:gap-24 items-center"
          animate={{ x: ["0%", "-33.333%"] }}
          transition={{
            ease: "linear",
            duration: 60,
            repeat: Infinity,
          }}
        >
          {duplicatedBrands.map((brand, i) => (
            <Link
              key={`${brand.name}-${i}`}
              to={`/category/all?brand=${brand.name}`}
              className="group relative inline-block shrink-0 px-4"
            >
              <div className="text-2xl sm:text-3xl md:text-5xl font-display font-black text-muted-foreground/20 group-hover:text-primary/60 transition-all duration-500 cursor-pointer tracking-tighter grayscale group-hover:grayscale-0 select-none">
                {brand.name}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary/30 group-hover:w-full transition-all duration-500 rounded-full" />
            </Link>
          ))}
        </motion.div>
      </div>
      
      {/* Side gradients for soft fading effect */}
      <div className="absolute top-0 bottom-0 left-0 w-20 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
};
