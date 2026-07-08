import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Smartphone, 
  AlertCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Image as ImageIcon,
  Play,
  History,
  Loader2,
  Wrench,
  Download,
  Share2,
  ExternalLink,
  Eye,
  Maximize2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosConfig";
import { RepairRequest, TicketStatus } from "@/types/repair";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

const getMediaUrl = (url: string) => {
  if (!url) return "";
  // If URL contains 127.0.0.1 or localhost, strip it to make it relative
  if (url.includes("127.0.0.1") || url.includes("localhost")) {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch (e) {
      return url;
    }
  }
  return url;
};

const ServiceTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/service-tickets/${id}/`);
      setTicket(response.data);
    } catch (error) {
      toast.error("Failed to fetch ticket details");
      navigate("/admin/service-submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const updateStatus = async (newStatus: TicketStatus) => {
    try {
      setUpdating(true);
      const payload = { status: newStatus };
      await axiosInstance.patch(`/admin/service-tickets/${id}/`, payload);
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTicket(); // Refresh to get history
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string; error?: string } }; message: string };
      console.error("Status update error:", axiosError.response?.data || axiosError.message);
      const errorMsg = axiosError.response?.data?.detail || axiosError.response?.data?.error || "Failed to update status";
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending': return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 px-4 py-1.5 rounded-full font-black tracking-widest text-xs">PENDING</Badge>;
      case 'submitted': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-1.5 rounded-full font-black tracking-widest text-xs">SUBMITTED</Badge>;
      case 'in_progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 rounded-full font-black tracking-widest text-xs animate-pulse">IN PROGRESS</Badge>;
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1.5 rounded-full font-black tracking-widest text-xs">COMPLETED</Badge>;
      case 'cancelled': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-4 py-1.5 rounded-full font-black tracking-widest text-xs">CANCELLED</Badge>;
      default: return <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black tracking-widest text-xs">{status?.toUpperCase() || "UNKNOWN"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="text-muted-foreground font-bold animate-pulse">Fetching service record...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-2xl h-12 w-12 border-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black tracking-tighter uppercase">
                 Ticket <span className="text-emerald-500">{ticket.ticket_id}</span>
               </h1>
               {getStatusBadge(ticket.status)}
             </div>
             <p className="text-muted-foreground flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
               <Calendar size={12} /> Registered on {ticket.createdAt && format(new Date(ticket.createdAt), "dd MMMM yyyy 'at' HH:mm")}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
           <Button variant="outline" className="rounded-xl font-bold gap-2">
             <Share2 size={18} /> Share
           </Button>
           <Button variant="outline" className="rounded-xl font-bold gap-2">
             <Download size={18} /> Export PDF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Customer Data */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-card border border-border p-6 rounded-3xl space-y-6"
             >
                <div className="flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-widest border-b border-border pb-4">
                  <User size={16} /> Customer Data
                </div>
                <div className="space-y-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Full Name</span>
                      <span className="text-lg font-black text-foreground">{ticket.customer_name}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Contact Details</span>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold">{ticket.phone}</span>
                         <div className="w-1 h-1 bg-muted rounded-full" />
                         <span className="text-sm text-muted-foreground">{ticket.email || "N/A"}</span>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Service Method</span>
                      <Badge variant="outline" className="w-fit capitalize font-bold text-xs px-3">{ticket.delivery_method?.replace('_', ' ')}</Badge>
                   </div>
                   {ticket.pickup_address && (
                     <div className="flex flex-col bg-muted/50 p-4 rounded-2xl border border-border">
                        <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Pickup Address</span>
                        <p className="text-xs font-bold leading-relaxed italic">"{ticket.pickup_address}"</p>
                     </div>
                   )}
                </div>
             </motion.div>

             {/* Device Data */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-card border border-border p-6 rounded-3xl space-y-6"
             >
                <div className="flex items-center gap-3 text-blue-600 font-black text-xs uppercase tracking-widest border-b border-border pb-4">
                  <Smartphone size={16} /> Device Specs
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Brand</span>
                         <span className="text-sm font-black text-foreground uppercase tracking-tight">{ticket.brand_name}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Model</span>
                         <span className="text-sm font-black text-foreground">{ticket.model}</span>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Serial Number</span>
                      <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded w-fit">{ticket.serial_number || "NOT SPECIFIED"}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-black uppercase mb-1">Service Required</span>
                      <Badge className="bg-blue-500/10 text-blue-600 border-none w-fit font-bold capitalize">{ticket.service_type}</Badge>
                   </div>
                </div>
             </motion.div>
          </div>

          {/* Issue Description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border p-8 rounded-[2.5rem] relative group"
          >
             <div className="absolute top-0 right-0 p-8 text-amber-500/10">
                <AlertCircle size={80} strokeWidth={1} />
             </div>
             <div className="flex items-center gap-3 text-amber-600 font-black text-xs uppercase tracking-widest mb-6">
                <MessageSquare size={16} /> Problem Description
             </div>
             <p className="text-lg font-bold leading-relaxed text-foreground relative z-10 italic">
               "{ticket.description}"
             </p>
          </motion.div>

          {/* Media Attachments */}
          {ticket.media && (ticket.media.images?.length > 0 || ticket.media.video) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest">
                    <ImageIcon size={16} /> Evidence Gallery
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {ticket.media.images?.length || 0} Images • {ticket.media.video ? "1 Video" : "No Video"}
                  </span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ticket.media.images?.map((url, i) => (
                    <div 
                      key={i} 
                      className="group relative aspect-square rounded-[2rem] overflow-hidden border-2 border-border hover:border-emerald-500 transition-all cursor-pointer"
                      onClick={() => setSelectedMedia({ url: getMediaUrl(url), type: 'image' })}
                    >
                       <img 
                        src={getMediaUrl(url)} 
                        alt={`evidence-${i}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                          <Maximize2 className="text-white" size={24} />
                          <span className="text-[10px] text-white font-black uppercase tracking-widest">Enlarge</span>
                       </div>
                    </div>
                  ))}
                  
                  {ticket.media.video && (
                    <div 
                      className="aspect-square rounded-[2rem] overflow-hidden border-2 border-border bg-black relative group flex items-center justify-center cursor-pointer"
                      onClick={() => setSelectedMedia({ url: getMediaUrl(ticket.media!.video!), type: 'video' })}
                    >
                       <video 
                        src={getMediaUrl(ticket.media.video)} 
                        className="w-full h-full object-cover opacity-60"
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                       />
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-emerald-500 group-hover:scale-110 transition-all">
                             <Play fill="white" size={24} />
                          </div>
                          <span className="text-[10px] font-black uppercase mt-4 tracking-[0.2em] opacity-80 group-hover:opacity-100">Play Evidence</span>
                       </div>
                    </div>
                  )}
               </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
           {/* Actions Card */}
           <div className="bg-card border-4 border-foreground p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic">Management Actions</h3>
                <div className="h-1 w-12 bg-emerald-500 mx-auto" />
              </div>

              <div className="space-y-3">
                 <Button 
                   onClick={() => updateStatus('in_progress')}
                   disabled={updating || ticket.status === 'in_progress'}
                   className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-amber-500/20"
                 >
                    {updating ? <Loader2 className="animate-spin" /> : <Clock />}
                    Start Repair Process
                 </Button>
                 
                 <Button 
                    onClick={() => updateStatus('completed')}
                    disabled={updating || ticket.status === 'completed'}
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-600/20"
                 >
                    {updating ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Complete & Notify
                 </Button>

                 <Button 
                    onClick={() => updateStatus('cancelled')}
                    disabled={updating || ticket.status === 'cancelled'}
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-2 border-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-xs gap-3 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                 >
                    {updating ? <Loader2 className="animate-spin" /> : <XCircle />}
                    Reject Application
                 </Button>
              </div>

              <div className="pt-6 border-t border-border space-y-4">
                 <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-xl font-bold h-12 text-blue-600 hover:bg-blue-50"
                    onClick={() => toast.info("Chat integration coming soon")}
                 >
                    <MessageSquare size={18} /> Chat with Customer
                 </Button>
                 <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-xl font-bold h-12 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => toast.info("Technician assignment coming soon")}
                 >
                    <Wrench size={18} /> Assign Technician
                 </Button>
              </div>
           </div>

           {/* Timeline */}
           <div className="bg-muted p-8 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-3 text-muted-foreground font-black text-xs uppercase tracking-widest border-b border-border/50 pb-4">
                <History size={16} /> Status Timeline
              </div>

              <div className="space-y-8">
                 {!ticket.status_history || ticket.status_history.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-medium italic text-center py-10">No tracking history yet.</p>
                 ) : (
                    <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[2px] before:bg-card/50">
                       {ticket.status_history.map((h, i) => (
                          <div key={i} className="relative">
                             <div className={`absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-4 border-muted z-10 ${
                               i === 0 ? 'bg-emerald-500 scale-125 ring-4 ring-emerald-500/10' : 'bg-card'
                             }`} />
                             <div className="space-y-2">
                                <div className="flex flex-col">
                                   <span className={`text-xs font-black uppercase tracking-tight ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                     {h.status.replace('_', ' ')}
                                   </span>
                                   <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                     {format(new Date(h.timestamp), "MMM dd, HH:mm")}
                                   </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic pr-4">
                                   {h.note || "System updated status automatically."}
                                </p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Media Lightbox */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none rounded-3xl">
           <DialogHeader className="absolute top-4 right-4 z-50">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-black transition-all"
                onClick={() => setSelectedMedia(null)}
              >
                 <X size={20} />
              </Button>
           </DialogHeader>
           
           <div className="w-full h-full flex flex-col items-center justify-center p-8 min-h-[50vh]">
              {selectedMedia?.type === 'image' ? (
                <img 
                  src={selectedMedia.url} 
                  alt="Lightbox" 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" 
                />
              ) : selectedMedia?.type === 'video' ? (
                <video 
                  src={selectedMedia.url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" 
                />
              ) : null}
              
              <div className="mt-8 flex items-center gap-4">
                 <Button 
                   className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2"
                   onClick={() => window.open(selectedMedia?.url, '_blank')}
                 >
                    <ExternalLink size={18} /> Open in New Tab
                 </Button>
                 <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 font-bold rounded-xl"
                    onClick={() => setSelectedMedia(null)}
                 >
                    Close Viewer
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceTicketDetail;

