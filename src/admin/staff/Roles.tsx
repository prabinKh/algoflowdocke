import { useState, useRef } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { useStaff } from "@/hooks/useStaff";
import { useCustomers } from "@/hooks/useCustomers";
import { useAuth } from "@/context/AuthContext";
import { type StaffRole } from "@/api/staffService";
import { type Customer } from "@/types/admin";

const AVAILABLE_PERMISSIONS = [
  "dashboard:view",
  "products:read",
  "products:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "pos:access",
  "staff:manage",
  "reports:view",
  "settings:manage"
];

const Roles = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newPermission, setNewPermission] = useState("");
  
  // Assign Role States
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Customer[]>([]);
  const [selectedAssignRole, setSelectedAssignRole] = useState<StaffRole | null>(null);

  const { user } = useAuth();
  const canManageStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN';
  const { roles, loading, deleteRole, createRole, updateRole, createMember } = useStaff();
  const { customers } = useCustomers();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (role.permissions && Array.isArray(role.permissions) && role.permissions.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredUsers = customers.filter(customer => 
    !selectedUsers.find(u => u.id === customer.id) &&
    (customer.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    customer.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleName("");
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleAssignRole = () => {
    setUserSearchTerm("");
    setSelectedUsers([]);
    setSelectedAssignRole(null);
    setIsAssignModalOpen(true);
  };

  const handleEditRole = (role: StaffRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setIsModalOpen(true);
  };

  const handleDeleteRole = (role: StaffRole) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        deleteRole.mutate(role.id);
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete role");
      }
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    
    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          data: { name: roleName, permissions: selectedPermissions }
        });
      } else {
        await createRole.mutateAsync({
          name: roleName,
          permissions: selectedPermissions
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || !selectedAssignRole) {
      toast.error("Please select at least one user and a role");
      return;
    }

    try {
      await Promise.all(selectedUsers.map(user => 
        createMember.mutateAsync({
          user: user.id,
          role: selectedAssignRole.id,
        })
      ));
      setIsAssignModalOpen(false);
      toast.success("Role assigned to selected users successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign role to one or more users");
    }
  };

  const handleBulkDelete = () => {
    toast.error("Bulk delete initiated");
  };

  const handleReset = () => {
    toast.info("Resetting filters");
    setSearchTerm("");
    setEntriesPerPage(10);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-0" ref={containerRef}>
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-1 mb-8 gsap-reveal">
              <h1 className="text-2xl font-bold text-foreground">Roles</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/admin" className="hover:text-emerald-500 transition-colors">Home</Link>
                <ChevronRight size={14} />
                <span>Roles</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4 gsap-reveal">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <select 
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-muted-foreground">Entries Per Page</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBulkDelete}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                >
                  <RotateCcw size={18} />
                </button>
                <button 
                  onClick={() => toast.info("Refreshing data...")}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-amber-100"
                >
                  <RotateCcw size={18} />
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64"
                  />
                </div>
                {canManageStaff && (
                  <>
                    <button 
                      onClick={handleAssignRole}
                      className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                      title="Assign Role to User"
                    >
                      <UserPlus size={18} />
                    </button>
                    <button 
                      onClick={handleAddRole}
                      className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Plus size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden gsap-reveal">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-bottom border-border">
                      <th className="p-4 w-12">
                        <input type="checkbox" className="rounded border-border text-emerald-500 focus:ring-emerald-500" />
                      </th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Role</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Permissions</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-border text-emerald-500 focus:ring-emerald-500" />
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-foreground">{role.name}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2 max-w-3xl">
                            { (role.permissions || []).map((perm, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-medium rounded-md"
                              >
                                {perm}
                              </span>
                            ))}
                            <button 
                              onClick={() => toast.info(`Showing all permissions for ${role.name}`)}
                              className="text-blue-500 text-[10px] font-bold hover:underline"
                            >
                              Show More
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {canManageStaff && (
                              <>
                                <button 
                                  onClick={() => handleEditRole(role)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRole(role)}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing 1 to {filteredRoles.length} of {filteredRoles.length} entries</p>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors border border-border">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="w-8 h-8 bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20">1</button>
                  <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors border border-border">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Create/Edit Role Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
              <h3 className="text-xl font-bold text-foreground mb-4">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h3>
              <form onSubmit={handleSaveRole} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Name</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., Inventory Manager"
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Permissions</label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      placeholder="Add custom permission (e.g. blog:write)"
                      className="flex-1 bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPermission && !selectedPermissions.includes(newPermission)) {
                          setSelectedPermissions([...selectedPermissions, newPermission]);
                          setNewPermission("");
                        }
                      }}
                      className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions(prev => [...prev, perm]);
                            } else {
                              setSelectedPermissions(prev => prev.filter(p => p !== perm));
                            }
                          }}
                          className="rounded border-border text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-medium text-foreground capitalize">{perm.replace(":", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-accent rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRole.isPending || updateRole.isPending}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {createRole.isPending || updateRole.isPending ? "Saving..." : "Save Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Role Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
              <h3 className="text-xl font-bold text-foreground mb-4">Assign Role to User</h3>
              <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search User</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                    />
                  </div>
                  {userSearchTerm && !selectedUsers.find(u => u.name === userSearchTerm) && (
                    <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUsers(prev => [...prev, user])}
                          className="w-full text-left p-2 hover:bg-accent text-sm"
                        >
                          {user.name} ({user.email})
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                       {selectedUsers.map(user => (
                         <div key={user.id} className="p-2 bg-emerald-500/10 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium">
                           {user.name}
                           <button type="button" onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))} className="text-xs text-rose-500">Remove</button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Role</label>
                  <select
                    value={selectedAssignRole?.id || ""}
                    onChange={(e) => setSelectedAssignRole(roles.find(r => r.id == e.target.value) || null)}
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-accent rounded-xl text-xs font-bold uppercase tracking-wider transition-colors text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMember.isPending}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {createMember.isPending ? "Assigning..." : "Assign Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default Roles;
