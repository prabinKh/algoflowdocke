import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/api/productService';


import { useStore } from '@/frontend/context/StoreContext';

export const useProducts = () => {
  const { companySlug } = useStore();
  
  const { data: dbProducts = [], isLoading: loading } = useQuery({
    queryKey: ['products', companySlug],
    queryFn: () => productService.getAll({ company: companySlug }),
    refetchInterval: 30000,
  });

  const allProducts = useMemo(() => {
    if (!Array.isArray(dbProducts)) return [];
    return dbProducts.map(p => {
      const categoryName = p.category_name || (typeof p.category === 'string' ? p.category : String(p.category || ''));
      const categorySlug = p.categorySlug || p.category_slug || '';
      const brandName = p.brand_name || (typeof p.brand === 'string' ? p.brand : String(p.brand || ''));
      
      return {
        ...p,
        category: categoryName,
        categorySlug: categorySlug,
        brand: brandName
      };
    });
  }, [dbProducts]);

  return { products: allProducts, loading };
};
