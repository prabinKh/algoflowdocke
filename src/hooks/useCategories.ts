import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/api/categoryService';
import { type Category } from '@/lib/types';
import { useStore } from '@/frontend/context/StoreContext';

export const useCategories = () => {
  const { companySlug } = useStore();
  
  const { data: dbCategories = [], isLoading: loading } = useQuery({
    queryKey: ['categories', companySlug],
    queryFn: () => categoryService.getAll({ company: companySlug }),
  });

  const allCategories = useMemo(() => {
    if (!Array.isArray(dbCategories)) return [];
    return dbCategories;
  }, [dbCategories]);

  return { categories: allCategories, loading };
};
