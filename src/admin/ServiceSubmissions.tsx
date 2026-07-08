import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Calendar,
  User,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Settings as SettingsIcon,
  Wrench,
  Image as ImageIcon,
  Play,
  History,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import axiosInstance from "@/api/axiosConfig";
import { RepairRequest, TicketStatus } from "@/types/repair";
import { format } from "date-fns";

interface ServiceSubmissionsProps {
  title?: string;
  defaultStatus?: string;
}

const ServiceSubmissions = ({ title, defaultStatus = "all" }: ServiceSubmissionsProps) => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(defaultStatus);
  }, [defaultStatus]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/service-tickets/');
      setSubmissions(response.data);
    } catch (error) {
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const updateTicketStatus = async (id: string, newStatus: TicketStatus) => {
    try {
      setUpdatingStatus(id);
      await axiosInstance.patch(`/admin/service-tickets/${id}/`, { status: newStatus });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const seedTestData = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/admin/service-tickets/seed_test_data/');
      toast.success("5 Test Service Tickets Created!");
      fetchSubmissions();
    } catch (error) {
      toast.error("Failed to seed test data");
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 px-3 py-1 rounded-full font-bold">PENDING</Badge>;
      case 'submitted': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 rounded-full font-bold">SUBMITTED</Badge>;
      case 'in_progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 rounded-full font-bold animate-pulse">IN PROGRESS</Badge>;
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 rounded-full font-bold">COMPLETED</Badge>;
      case 'cancelled': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-3 py-1 rounded-full font-bold">CANCELLED</Badge>;
      default: return <Badge variant="outline">{status?.toUpperCase()}</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.model.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "new" ? (s.status === "submitted" || s.status === "pending") : s.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
            {title ? (
              <>
                <span className="text-emerald-500">{title.split(' ')[0]}</span>
                {title.split(' ').slice(1).join(' ')}
              </>
            ) : (
              <>Service <span className="text-emerald-500">Submissions</span></>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track repair requests from customers</p>
        </div>

        <div className="flex items-center gap-3">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2">
                  <SettingsIcon size={18} />
                  Service Config
                  <ChevronDown size={14} className="ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-border">
                <DropdownMenuItem onClick={() => navigate("/admin/service-categories")} className="rounded-xl p-3 cursor-pointer">
                  <Badge className="mr-3 bg-blue-500/10 text-blue-500 border-none px-1.5 py-0.5">BC</Badge>
                  <span className="font-bold text-sm">Categories & Brands</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/service-center-settings")} className="rounded-xl p-3 cursor-pointer">
                  <SettingsIcon size={16} className="mr-3 text-emerald-500" />
                  <span className="font-bold text-sm">Service Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={seedTestData} className="rounded-xl p-3 cursor-pointer bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                  <Wrench size={16} className="mr-3" />
                  <span className="font-bold text-sm uppercase">Generate 5 Test Requests</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/repair-products")} className="rounded-xl p-3 cursor-pointer">
                  <Wrench size={16} className="mr-3 text-amber-500" />
                  <span className="font-bold text-sm">Spare Parts Inventory</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>

           <Button className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20">
              Export Submissions
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by Ticket ID, Customer, or Device..." 
            className="pl-10 h-12 bg-card border-border rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('all')}
            className="flex-1 rounded-xl font-bold"
           >
             All
           </Button>
           <Button 
            variant={statusFilter === 'new' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('new')}
            className={`flex-1 rounded-xl font-bold ${statusFilter === 'new' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
           >
             New
           </Button>
        </div>
        <div className="flex gap-2">
           <Button 
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('in_progress')}
            className={`flex-1 rounded-xl font-bold ${statusFilter === 'in_progress' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
           >
             Active
           </Button>
           <Button 
            variant={statusFilter === 'completed' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('completed')}
            className={`flex-1 rounded-xl font-bold ${statusFilter === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
           >
             Done
           </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Ticket ID</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Customer</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Device / Issues</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8 h-20 bg-muted/10"></td>
                </tr>
              ))
            ) : filteredSubmissions.length === 0 ? (
               <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-medium italic">
                  No repair requests found matching filters.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/admin/service-tickets/${ticket.id}`)}
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-foreground tracking-tight">{ticket.ticket_id}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold mt-1 uppercase">
                        <Calendar size={10} /> {ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, HH:mm") : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 font-bold">
                        {ticket.customer_name[0]}
                      </div>
                      <div className="flex flex-col">
                         <span className="font-bold text-sm">{ticket.customer_name}</span>
                         <span className="text-xs text-muted-foreground">{ticket.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] h-4 font-black bg-muted/50 border-none">{ticket.brand_name?.toUpperCase()}</Badge>
                        <span className="text-sm font-bold truncate">{ticket.model}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">"{ticket.description}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(ticket.status || "submitted")}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                       {updatingStatus === ticket.id ? (
                         <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                       ) : (
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-border">
                            <DropdownMenuItem onClick={() => navigate(`/admin/service-tickets/${ticket.id}`)} className="rounded-xl p-3 cursor-pointer">
                              <Eye size={16} className="mr-3 text-blue-500" />
                              <span className="font-bold text-sm">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                              <MessageSquare size={16} className="mr-3 text-emerald-500" />
                              <span className="font-bold text-sm">Send WhatsApp</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateTicketStatus(ticket.id!, 'in_progress')}
                              disabled={ticket.status === 'in_progress'}
                              className="rounded-xl p-3 cursor-pointer"
                            >
                              <Clock size={16} className="mr-3 text-amber-500" />
                              <span className="font-bold text-sm uppercase italic">Set as Active</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateTicketStatus(ticket.id!, 'completed')}
                              disabled={ticket.status === 'completed'}
                              className="rounded-xl p-3 cursor-pointer"
                            >
                              <CheckCircle2 size={16} className="mr-3 text-emerald-500" />
                              <span className="font-bold text-sm uppercase italic">Complete Repair</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateTicketStatus(ticket.id!, 'cancelled')}
                              disabled={ticket.status === 'cancelled'}
                              className="rounded-xl p-3 cursor-pointer text-rose-500"
                            >
                              <XCircle size={16} className="mr-3" />
                              <span className="font-bold text-sm uppercase italic">Cancel Ticket</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceSubmissions;
