import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { 
  MoreVertical, 
  Plus, 
  User as UserIcon,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  Menu,
  Trash2,
  Edit2
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useStaff } from "@/hooks/useStaff";
import { useAuth } from "@/context/AuthContext";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { type StaffMember } from "@/api/staffService";

const Users = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const { user } = useAuth();
  const canManageStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN';
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | number>("");

  const { members, roles, loading, deleteMember, createMember, updateMember } = useStaff();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  const filteredUsers = members.filter(member => {
    const nameVal = member.user_details?.name || "Unknown";
    const emailVal = member.user_details?.email || "";
    const roleName = member.role_details?.name || "";
    return (
      nameVal.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emailVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddUser = () => {
    setEditingMember(null);
    setEmail("");
    setName("");
    setPassword("");
    setSelectedRoleId(roles[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleEditUser = (member: StaffMember) => {
    setEditingMember(member);
    setEmail(member.user_details?.email || "");
    setName(member.user_details?.name || "");
    setPassword(""); // Keep password empty unless changing
    setSelectedRoleId(member.role || "");
    setIsModalOpen(true);
  };

  const handleDeleteUser = (member: StaffMember) => {
    if (confirm(`Are you sure you want to remove ${member.user_details?.name}?`)) {
      deleteMember.mutate(member.id);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Email and Name are required");
      return;
    }
    if (!editingMember && !password.trim()) {
      toast.error("Password is required for new users");
      return;
    }

    try {
      if (editingMember) {
        const payload: Partial<StaffMember> & { password?: string; email?: string; name?: string } = { email, name };
        if (password.trim()) {
          payload.password = password;
        }
        if (selectedRoleId) {
          payload.role = selectedRoleId;
        }
        await updateMember.mutateAsync({
          id: editingMember.id,
          data: payload
        });
      } else {
        await createMember.mutateAsync({
          email,
          name,
          password,
          role: selectedRoleId || undefined
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
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
              <h1 className="text-2xl font-bold text-foreground">Users</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/admin" className="hover:text-emerald-500 transition-colors">Home</Link>
                <ChevronRight size={14} />
                <span>Users</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 gsap-reveal">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
                  >
                    <List size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  />
                </div>
              </div>
              {canManageStaff && (
                <button 
                  onClick={handleAddUser}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 w-full md:w-auto justify-center font-bold"
                >
                  <Plus size={18} />
                  <span>Add User</span>
                </button>
              )}
            </div>

            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gsap-reveal">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all group relative"
                  >
                    <div className="absolute top-4 left-4 font-bold">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {user.role_details?.name || "No Role"}
                      </span>
                    </div>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      {canManageStaff && (
                        <>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 text-muted-foreground hover:text-emerald-500 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-center mt-8">
                      <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-sm">
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <UserIcon size={40} />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-emerald-500 transition-colors">
                        {user.user_details?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.user_details?.email}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Create New User Card */}
                <motion.button
                  onClick={handleAddUser}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: filteredUsers.length * 0.05 }}
                  className="bg-muted/50 rounded-2xl p-6 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:bg-muted hover:border-emerald-500/50 transition-all group min-h-[280px]"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-foreground mb-1">Create New User</h3>
                    <p className="text-sm text-muted-foreground">Click here to Create New User</p>
                  </div>
                </motion.button>
              </div>
            ) : (
              /* List View */
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden gsap-reveal">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-bottom border-border">
                        <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">User</th>
                        <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Email</th>
                        <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Role</th>
                        <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <span className="text-sm font-medium text-foreground">{user.user_details?.name || "Unknown"}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{user.user_details?.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-bold uppercase tracking-wider">
                              {user.role_details?.name || "No Role"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              {canManageStaff && (
                                <>
                                  <button 
                                    onClick={() => handleEditUser(user)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user)}
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
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
              <h3 className="text-xl font-bold text-foreground mb-4">
                {editingMember ? "Edit User Account" : "Add New Staff User"}
              </h3>
              <form onSubmit={handleSaveMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingMember ? "Leave blank to keep unchanged" : "••••••••"}
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Staff Role</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                  >
                    <option value="">No Role Assigned</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
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
                    disabled={createMember.isPending || updateMember.isPending}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {createMember.isPending || updateMember.isPending ? "Saving..." : "Save User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default Users;
