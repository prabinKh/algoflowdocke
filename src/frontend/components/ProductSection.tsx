import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { type Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { motion } from "motion/react";

type Props = {
  title: string;
  products: Product[];
  viewAllLink?: string;
  columns?: number;
};

export const ProductSection = ({ title, products, viewAllLink, columns = 4 }: Props) => {
  const gridClass = columns === 6
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    : columns === 3
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      
      {title && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-2 h-10 sm:h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tighter text-foreground uppercase leading-none">
                {title}
              </h2>
              <div className="h-1 w-24 bg-primary/20 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileInView={{ x: "0%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full w-full bg-primary"
                />
              </div>
            </div>
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-primary transition-all hover:gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 hover:bg-primary/10"
            >
              <span className="uppercase tracking-[0.2em]">Explore All</span>
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </motion.div>
      )}
      <div className={`grid ${gridClass} gap-4 sm:gap-6 lg:gap-8`}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
};
