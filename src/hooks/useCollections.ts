import { useQuery } from '@tanstack/react-query';
import { collectionService } from '@/api/collectionService';
import { useStore } from '@/frontend/context/StoreContext';
import { useMemo } from 'react';

export const useCollections = () => {
  const { companySlug } = useStore();
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['collections', 'public', companySlug],
    queryFn: () => collectionService.getAllPublic(),
    refetchInterval: 60000,
  });

  const collections = useMemo(() => Array.isArray(data) ? data : [], [data]);

  return { collections, loading };
};
