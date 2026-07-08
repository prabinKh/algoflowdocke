import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/api/customerService';
import { useMemo } from 'react';

export const useCustomers = () => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    refetchInterval: 60000, // Poll every minute
  });

  const customers = useMemo(() => Array.isArray(data) ? data : [], [data]);

  return { customers, loading };
};
