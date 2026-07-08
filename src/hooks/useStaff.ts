import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService, type StaffRole, type StaffMember } from "@/api/staffService";
import { toast } from "sonner";

export const useStaff = () => {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: () => staffService.getRoles(),
  });

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => staffService.getMembers(),
  });

  const createRole = useMutation({
    mutationFn: (data: Partial<StaffRole>) => staffService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<StaffRole> }) =>
      staffService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string | number) => staffService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMember = useMutation({
    mutationFn: (data: Partial<StaffMember>) => staffService.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member added successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<StaffMember> }) =>
      staffService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMember = useMutation({
    mutationFn: (id: string | number) => staffService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member removed successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    roles,
    members,
    loading: loadingRoles || loadingMembers,
    createRole,
    updateRole,
    deleteRole,
    createMember,
    updateMember,
    deleteMember,
  };
};
