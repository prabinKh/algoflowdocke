import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/api/orderService';
import { type Order } from '@/types/admin';
import { toast } from 'sonner';

export const useOrders = (options?: { status?: string; exclude_status?: string; payment_status?: string }) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['orders', options],
    queryFn: () => orderService.getAll(options),
    refetchInterval: 3000, 
    staleTime: 2000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: Order['status'] }) => 
      orderService.updateStatus(id, status),
    // Optimistic Update Implementation
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>(['orders', options]);

      // Optimistically update to the new value
      if (previousOrders) {
        queryClient.setQueryData<Order[]>(['orders', options], 
          previousOrders.map(order => order.id === id ? { ...order, status } : order)
        );
      }

      return { previousOrders };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders', options], context.previousOrders);
      }
      toast.error("Failed to update status. Rolled back changes.");
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return { 
    orders, 
    loading, 
    refresh: refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending
  };
};
