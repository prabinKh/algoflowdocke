import { useQuery } from "@tanstack/react-query";
import { repairService } from "@/api/repairService";

export interface RepairTicket {
  id: string | number;
  ticketId: string;
  category: string;
  brand: string;
  model: string;
  component: string;
  description: string;
  status: string;
  createdAt: string;
  userId: string | number;
  userName: string;
  userEmail: string;
}

export const useRepairTickets = () => {
  const { data: tickets = [], isLoading: loading } = useQuery({
    queryKey: ['repair_tickets'],
    queryFn: () => repairService.getAll(),
    refetchInterval: 30000,
  });

  return { tickets, loading };
};
