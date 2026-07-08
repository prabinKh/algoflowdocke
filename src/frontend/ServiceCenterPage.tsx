import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Wrench, Clock, Truck, 
  ChevronRight, ArrowLeft, Check,
  Camera, MapPin, Calendar, Smartphone,
  Monitor, Tv, Speaker, Printer, Gamepad, HelpCircle, Package, Info, ShieldCheck,
  Video, Upload, Plus, Trash2, X, AlertCircle, Loader2,
  Image as ImageIcon, CheckCircle2, MessageSquare, Mail, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadService } from "@/api/uploadService";
import { repairService } from "@/api/repairService";
import { ServiceCategory, ServiceBrand, RepairRequest } from "@/types/repair";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/api/chatService";
import axiosInstance from "@/api/axiosConfig";

const ServiceCenterPage: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<ServiceBrand | null>(null);
  const [view, setView] = useState<'categories' | 'brands' | 'wizard'>('categories');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RepairRequest>>({
    model: "",
    serial_number: "",
    description: "",
    delivery_method: "drop_off",
    service_type: "standard",
    customer_name: user?.name || "",
    phone: "",
    email: user?.email || "",
    pickup_address: ""
  });

  const [media, setMedia] = useState<{
    images: File[];
    video: File | null;
    imageUrls: string[];
    videoUrl: string | null;
  }>({
    images: [],
    video: null,
    imageUrls: [],
    videoUrl: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await repairService.getServiceCategories();
        setCategories(data);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Success State
  const [successData, setSuccessData] = useState<{
    id: string;
    category: string;
    brand: string;
    model: string;
    serial_number?: string;
    customer_name: string;
    phone: string;
    email: string;
    description: string;
    delivery_method: string;
    pickup_address?: string;
    images: string[];
    video?: string;
  } | null>(null);

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setView('brands');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrandSelect = (brand: ServiceBrand) => {
    setSelectedBrand(brand);
    setView('wizard');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (view === 'brands') setView('categories');
    else if (view === 'wizard') {
      if (step > 1) setStep(step - 1);
      else setView('brands');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.images.length + files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }
    
    setMedia(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imageUrls: [...prev.imageUrls, ...files.map(f => URL.createObjectURL(f))]
    }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 3 minute check simulated by file size or just informative
      setMedia(prev => ({
        ...prev,
        video: file,
        videoUrl: URL.createObjectURL(file)
      }));
    }
  };

  const removeImage = (index: number) => {
    setMedia(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const uploadedImages: string[] = [];
      for (const img of media.images) {
        if (!img) continue;
        try {
          const url = await uploadService.uploadImage(img, 'service/tickets/images');
          uploadedImages.push(url);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          // Continue with other images or fail? Let's fail if image upload was intended but failed badly
        }
      }

      // 2. Upload Video
      let uploadedVideo = "";
      if (media.video) {
        try {
          uploadedVideo = await uploadService.uploadImage(media.video, 'service/tickets/videos');
        } catch (uploadErr) {
          console.error("Video upload failed:", uploadErr);
        }
      }

      // 3. Submit Ticket
      const submissionData = {
        ...formData,
        service_category: selectedCategory?.id,
        service_brand: selectedBrand?.id,
        category: selectedCategory?.name,
        brand: selectedBrand?.name,
        brand_name: selectedBrand?.name,
        component: selectedCategory?.name,
        userName: formData.customer_name,
        userEmail: formData.email,
        userId: user?.id,
        serialNumber: formData.serial_number, // Align with admin expectations
        serviceType: formData.service_type || 'standard',
        contactChannel: 'Service Center Web',
        media: {
          images: uploadedImages,
          video: uploadedVideo
        }
      };

      const response = await repairService.submitTicket(submissionData);
      const tid = response.ticketId || response.ticket_id || response.id || "TKT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      setTicketId(tid);
      
      setSuccessData({
        id: tid,
        category: selectedCategory?.name || "",
        brand: selectedBrand?.name || "",
        model: formData.model || "",
        serial_number: formData.serial_number,
        customer_name: formData.customer_name || "",
        phone: formData.phone || "",
        email: formData.email || "",
        description: formData.description || "",
        delivery_method: formData.delivery_method || "drop_off",
        pickup_address: formData.pickup_address,
        images: uploadedImages,
        video: uploadedVideo
      });

      setStep(5);
      toast.success("Repair request submitted!");
    } catch (error) {
      console.error("Submission error details:", error);
      let errorMsg = "Failed to submit request";
      const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
      if (axiosError.response?.data) {
        errorMsg = axiosError.response.data.error || axiosError.response.data.message || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareChat = async () => {
    if (!successData || !user) {
      toast.error("Required data missing for chat sharing");
      return;
    }
    
    try {
      toast.loading("Connecting to chat...");
      const sessionId = await chatService.getOrCreateSession(user.id, user.email, user.name);
      
      const attachments: string[] = [...successData.images];
      if (successData.video) attachments.push(successData.video);

      const message = `🛠️ *NEW REPAIR REQUEST SUMMARY*\n\n` +
        `*Ticket ID:* ${successData.id}\n` +
        `*Status:* SUBMITTED ✅\n\n` +
        `*--- DEVICE INFO ---*\n` +
        `*Category:* ${successData.category}\n` +
        `*Brand:* ${successData.brand}\n` +
        `*Model:* ${successData.model}\n` +
        (successData.serial_number ? `*Serial:* ${successData.serial_number}\n` : '') +
        `*Issue:* ${successData.description}\n\n` +
        `*--- CUSTOMER INFO ---*\n` +
        `*Name:* ${successData.customer_name}\n` +
        `*Phone:* ${successData.phone}\n` +
        `*Email:* ${successData.email}\n` +
        `*Delivery:* ${successData.delivery_method.replace('_', ' ').toUpperCase()}\n` +
        (successData.pickup_address ? `*Address:* ${successData.pickup_address}\n` : '') +
        `\n_Ticket submitted with ${attachments.length} attachment(s)_`;
      
      await chatService.sendMessage(sessionId, message, "user", {}, attachments);
      toast.dismiss();
      toast.success("Details sent to support chat!");
      window.dispatchEvent(new CustomEvent("open-chat"));
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to share via chat");
    }
  };

  const handleShareEmail = () => {
    if (!successData) return;
    
    const subject = `Repair Request: ${successData.id} - ${successData.category} ${successData.brand}`;
    const body = `🛠️ NEW REPAIR REQUEST SUMMARY\n\n` +
      `Ticket ID: ${successData.id}\n` +
      `Status: SUBMITTED\n\n` +
      `--- DEVICE INFO ---\n` +
      `Category: ${successData.category}\n` +
      `Brand: ${successData.brand}\n` +
      `Model: ${successData.model}\n` +
      (successData.serial_number ? `Serial: ${successData.serial_number}\n` : '') +
      `Issue: ${successData.description}\n\n` +
      `--- CUSTOMER INFO ---\n` +
      `Name: ${successData.customer_name}\n` +
      `Phone: ${successData.phone}\n` +
      `Email: ${successData.email}\n` +
      `Delivery: ${successData.delivery_method.replace('_', ' ').toUpperCase()}\n` +
      (successData.pickup_address ? `Address: ${successData.pickup_address}\n` : '') +
      `\n--- ATTACHMENTS LINKS ---\n` +
      (successData.images.length > 0 ? `View Photos: \n${successData.images.map((url, i) => `Photo ${i + 1}: ${window.location.origin}${url}`).join('\n')}\n` : 'Images: None\n') +
      (successData.video ? `View Video: ${window.location.origin}${successData.video}\n` : 'Video: None\n') +
      `\nSent via FixItAll App.`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderCategoryGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map((category) => (
        <motion.div
           key={category.id}
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           whileHover={{ y: -5 }}
            className="group cursor-pointer"
            onClick={() => handleCategorySelect(category)}
        >
          <div className="bg-card text-card-foreground border border-border p-8 rounded-3xl h-full flex flex-col items-center text-center hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500" />
             
             <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-primary group-hover:text-white transition-colors">
               {category.logo_url ? (
                  <img src={category.logo_url} alt={category.name} className="w-12 h-12 object-contain group-hover:brightness-0 group-hover:invert transition-all" />
               ) : (
                  <Wrench size={32} />
               )}
             </div>

             <h3 className="text-2xl font-black tracking-tight mb-3 relative z-10 group-hover:text-primary transition-colors">
               {category.name}
             </h3>
             <p className="text-muted-foreground text-sm leading-relaxed relative z-10 italic">
               {category.description || `Professional repair services for all ${category.name} equipment and accessories.`}
             </p>

             <div className="mt-8 flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                Select category <ChevronRight size={14} />
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderBrandGrid = () => (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={handleBack} className="rounded-full gap-2">
            <ArrowLeft size={18} /> Back to Categories
         </Button>
         <Badge className="bg-primary font-black px-4 py-1">{selectedCategory?.name.toUpperCase()}</Badge>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase">Select Your <span className="text-primary text-gradient-primary">Brand</span></h2>
        <p className="text-muted-foreground font-medium italic">We provide expert service for major industry leaders. Choose the brand of your device to continue.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {selectedCategory?.brands?.map((brand) => (
          <motion.div
            key={brand.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group cursor-pointer bg-card border border-border p-6 rounded-3xl flex flex-col items-center gap-4 hover:border-primary hover:shadow-xl transition-all"
            onClick={() => handleBrandSelect(brand)}
          >
            <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center p-4 overflow-hidden">
               {brand.logo_url ? (
                 <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
               ) : (
                 <div className="text-3xl font-black text-muted-foreground/30">{brand.name[0]}</div>
               )}
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">{brand.name}</span>
          </motion.div>
        ))}
      </div>

      {(!selectedCategory?.brands || selectedCategory.brands.length === 0) && (
        <div className="text-center py-20 bg-muted rounded-3xl border border-dashed border-border text-muted-foreground">
           No specific brands listed for this category yet. Please check back later.
        </div>
      )}
    </div>
  );

  const renderWizard = () => {
    const steps = [
      { id: 1, label: "Device Info", icon: Smartphone },
      { id: 2, label: "Evidence", icon: Camera },
      { id: 3, label: "Contact", icon: User },
      { id: 4, label: "Confirm", icon: CheckCircle2 }
    ];

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
           <Button variant="ghost" onClick={handleBack} className="rounded-full gap-2">
              <ArrowLeft size={18} /> {step === 1 ? 'Back to Brands' : 'Back to Previous Step'}
           </Button>
           <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-black text-[10px]">{selectedCategory?.name}</Badge>
              <ChevronRight size={12} className="text-gray-300" />
              <Badge className="bg-blue-500 font-black text-[10px]">{selectedBrand?.name}</Badge>
           </div>
        </div>

        {/* Custom Progress Stepper */}
        <div className="mb-16 relative">
           <div className="absolute top-[18px] left-0 right-0 h-1 bg-gray-100 rounded-full" />
           <div 
             className="absolute top-[18px] left-0 h-1 bg-blue-500 rounded-full transition-all duration-500" 
             style={{ width: `${((step - 1) / 3) * 100}%` }}
           />
           <div className="flex justify-between relative z-10">
              {steps.map(s => (
                <div key={s.id} className="flex flex-col items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-gray-50 ${
                     step >= s.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-400'
                   }`}>
                     <s.icon size={18} />
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                     {s.label}
                   </span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5 relative overflow-hidden">
          {/* Step 1: Device Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black tracking-tighter uppercase">Tell us about the <span className="text-primary">Problem</span></h2>
                 <p className="text-muted-foreground text-sm font-medium italic">Describe the device and the issues you're experiencing.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Model Name / Number</Label>
                    <Input 
                      placeholder="e.g. iPhone 15 Pro, Dell XPS 13" 
                      className="h-14 bg-muted/30 border-border rounded-2xl px-6 focus-visible:ring-primary text-foreground"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Serial Number (Optional)</Label>
                    <Input 
                      placeholder="S/N: XXXXXXXX" 
                      className="h-14 bg-muted/30 border-border rounded-2xl px-6 focus-visible:ring-primary text-foreground"
                      value={formData.serial_number}
                      onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
                    />
                 </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-destructive">Describe the Issue (Detailed)</Label>
                  <Textarea 
                    placeholder="Describe symptoms, when it started, and any specific behaviors..." 
                    className="min-h-[160px] bg-muted/30 border-border rounded-[32px] px-6 py-4 focus-visible:ring-primary resize-none text-sm leading-relaxed font-medium text-foreground"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
               </div>
            </motion.div>
          )}

          {/* Step 2: Media Upload */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black tracking-tighter uppercase">Visual <span className="text-blue-500">Evidence</span></h2>
                 <p className="text-gray-500 text-sm font-medium italic">Upload photos or a short video to help our technicians diagnose early.</p>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Images Upload */}
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                           <ImageIcon size={14} className="text-blue-500" /> Device Photos (Max 3)
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                           {media.imageUrls.map((url, i) => (
                             <div key={i} className="aspect-square rounded-2xl bg-gray-100 relative group overflow-hidden border border-gray-200">
                                <img src={url} alt="upload" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => removeImage(i)}
                                  className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                             </div>
                           ))}
                           {media.images.length < 3 && (
                             <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/50">
                                <Plus size={24} className="text-gray-400" />
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                             </label>
                           )}
                        </div>
                     </div>

                     {/* Video Upload */}
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Video size={14} className="text-indigo-500" /> Problem Video (Max 3 Min)
                        </Label>
                        <div className="aspect-video bg-muted rounded-[32px] border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary transition-colors">
                           {media.videoUrl ? (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-indigo-50/30">
                                 <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                                    <Video size={24} />
                                 </motion.div>
                                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{media.video?.name.slice(0, 20)}...</span>
                                 <button onClick={() => setMedia(prev => ({ ...prev, video: null, videoUrl: null }))} className="text-[10px] text-rose-500 font-bold uppercase mt-2">Remove Video</button>
                              </div>
                           ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                    <Upload size={20} />
                                 </div>
                                 <p className="text-xs font-bold text-gray-500">Record or upload video</p>
                                 <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mt-1">MP4, MOV supported</p>
                                 <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                              </label>
                           )}
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                     <AlertCircle className="text-blue-500 mt-1" size={18} />
                     <div className="space-y-1">
                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest">Technician Insight</p>
                        <p className="text-xs text-blue-600/80 font-medium leading-relaxed">Visual documentation reduces diagnosis time by up to 60%. Highly recommended for intermittent software or audio issues.</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black tracking-tighter uppercase">Contact <span className="text-blue-500">Details</span></h2>
                 <p className="text-gray-500 text-sm font-medium italic">How should we get in touch with you about the repair?</p>
               </div>

               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
                       <Input 
                         placeholder="e.g. John Doe" 
                         className="h-14 bg-muted border-none rounded-2xl px-6 focus-visible:ring-primary"
                         value={formData.customer_name}
                         onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Phone Number</Label>
                       <Input 
                         placeholder="e.g. +977 12345678" 
                         className="h-14 bg-muted border-none rounded-2xl px-6 focus-visible:ring-primary"
                         value={formData.phone}
                         onChange={e => setFormData({ ...formData, phone: e.target.value })}
                       />
                    </div>
                  </div>

                  <div className="space-y-6">
                     <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Preferred Delivery Method</Label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'drop_off', label: 'Service Center Drop-off', icon: Package, desc: 'Visit our flagship branch' },
                          { id: 'pickup', label: 'Home/Office Pickup', icon: Truck, desc: 'Our team collects from you' },
                          { id: 'walk_in', label: 'Fast-Track Walk-in', icon: Calendar, desc: 'Immediate priority service' }
                        ].map(m => (
                          <div 
                            key={m.id}
                            className={`p-6 border-2 rounded-[32px] cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${
                              formData.delivery_method === m.id ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-gray-100 hover:border-blue-200'
                            }`}
                            onClick={() => setFormData({ ...formData, delivery_method: m.id as RepairRequest['delivery_method'] })}
                          >
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                               formData.delivery_method === m.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                             }`}>
                               <m.icon size={24} />
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-black tracking-tight">{m.label}</p>
                                <p className="text-[10px] text-gray-500 font-medium italic">{m.desc}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {formData.delivery_method === 'pickup' && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Pickup Address</Label>
                        <Textarea 
                          placeholder="Detailed address with landmarks..." 
                          className="min-h-[100px] bg-muted border-none rounded-2xl px-6 py-4 focus-visible:ring-primary resize-none"
                          value={formData.pickup_address}
                          onChange={e => setFormData({ ...formData, pickup_address: e.target.value })}
                        />
                     </motion.div>
                  )}
               </div>
            </motion.div>
          )}

          {/* Step 4: Final Confirmation */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black tracking-tighter uppercase">Final <span className="text-blue-500">Review</span></h2>
                 <p className="text-gray-500 text-sm font-medium italic">Please verify your information before submitting the request.</p>
               </div>

               <div className="space-y-6">
                  <div className="bg-muted rounded-[32px] p-8 border border-border divide-y divide-border">
                     <div className="pb-6 grid grid-cols-2 gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Context</span>
                        <span className="text-sm font-black text-right">{selectedCategory?.name} — {selectedBrand?.name}</span>
                     </div>
                     <div className="py-6 grid grid-cols-2 gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Device Identification</span>
                        <span className="text-sm font-black text-right">{formData.model} {formData.serial_number ? `(${formData.serial_number})` : ''}</span>
                     </div>
                     <div className="py-6 grid grid-cols-2 gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Contact</span>
                        <span className="text-sm font-black text-right">{formData.customer_name} ({formData.phone})</span>
                     </div>
                     <div className="py-6 grid grid-cols-2 gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery Logistic</span>
                        <span className="text-sm font-black text-right capitalize">{formData.delivery_method?.replace('_', ' ')}</span>
                     </div>
                     <div className="pt-6 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Baseline</span>
                           <span className="text-[9px] text-blue-500 font-bold italic uppercase mt-1">Diagnosis required for final quote</span>
                        </div>
                        <span className="text-2xl font-black text-blue-600 text-right">TBD</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                     <Info className="text-amber-500" size={18} />
                     <p className="text-[10px] font-bold text-amber-700 leading-relaxed italic">By submitting, you acknowledge that diagnosis stage may involve taking the device apart, which could void 3rd party warranties.</p>
                  </div>
               </div>
            </motion.div>
          )}

          {/* Success Page */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-10">
               <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
                  <Check size={48} />
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-sm">
                    <ShieldCheck size={16} /> Submission Confirmed
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase mb-2">Request <span className="text-emerald-500">Secured</span></h2>
                  <p className="text-gray-500 font-medium max-w-md mx-auto italic">Your unique service ticket has been generated. Our dispatchers will review it shortly and contact you.</p>
               </div>

               <div className="bg-card border border-border p-10 rounded-[40px] border-dashed relative group max-w-sm mx-auto">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">Service Ticket ID</span>
                  <span className="text-4xl font-black tracking-tighter text-blue-600 group-hover:scale-110 transition-transform block">{ticketId}</span>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse text-xs">NEW</div>
               </div>

               <div className="max-w-md mx-auto space-y-6 pt-6">
                 <div className="flex items-center gap-4 text-gray-400">
                   <div className="h-px flex-1 bg-gray-200" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Share Details</span>
                   <div className="h-px flex-1 bg-gray-200" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-16 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all gap-3"
                      onClick={handleShareChat}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <MessageSquare size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-tight">Share via Chat</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Direct Support</p>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-16 rounded-2xl border-2 border-gray-100 hover:border-rose-500 hover:bg-rose-50 transition-all gap-3"
                      onClick={handleShareEmail}
                    >
                      <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                        <Mail size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-tight">Share via Email</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Records / Proof</p>
                      </div>
                    </Button>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-2xl px-10 h-14 group transition-all shadow-lg shadow-blue-500/25"
                    onClick={() => window.location.href = `/track-orders?id=${ticketId}`}
                  >
                    Track Status <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] px-8"
                    onClick={() => window.location.reload()}
                  >
                    Close & Finish
                  </Button>
               </div>
            </motion.div>
          )}

          {/* Wizard Footer Controls */}
          {step < 5 && (
            <div className="mt-12 flex items-center justify-between pt-12 border-t border-gray-100">
               <Button 
                 variant="link" 
                 className="text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors"
                 onClick={handleBack}
               >
                 {step === 1 ? "Discard Request" : "Previous Step"}
               </Button>
               <Button 
                 className={`rounded-2xl px-12 h-14 font-black tracking-tight text-white transition-all shadow-xl ${
                   isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
                 }`}
                 onClick={() => {
                   if (step === 1 && !formData.model) return toast.error("Model name is required");
                   if (step === 3 && (!formData.customer_name || !formData.phone)) return toast.error("Name and phone are required");
                   
                   if (step < 4) setStep(step + 1);
                   else handleSubmit();
                 }}
                 disabled={isSubmitting}
               >
                 {isSubmitting ? (
                   <>
                     <Loader2 className="animate-spin mr-3" size={20} />
                     Proccessing...
                   </>
                 ) : (
                   step === 4 ? "Submit Request" : "Next Phase"
                 )}
               </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Helmet>
        <title>Advanced Service Center | FixItAll Professional Repair</title>
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 mt-10 mb-32 relative z-20">
        <AnimatePresence mode="wait">
          {view === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none rounded-[40px] overflow-hidden border-2 dark:border-white/20 border-black/10 shadow-2xl shadow-primary/20 group">
                  <CardContent className="p-8 md:p-12 relative flex flex-col justify-center min-h-[280px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                      <Wrench size={240} />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-none py-1 px-4 font-black tracking-widest text-[10px] uppercase">
                        Elite Maintenance Services
                      </Badge>
                      <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                        Pro Repair <span className="text-blue-200">Architecture.</span>
                      </h3>
                      <p className="text-blue-50/80 max-w-xl text-base font-medium leading-relaxed italic">
                        Industry-standard diagnostic workflows for enterprise and consumer electronics. Our certified technicians use architectural precision to restore your hardware to original operational standards.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-slate-300 dark:border-slate-700 rounded-[40px] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-xl border-dashed">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black uppercase tracking-tight text-lg">Guaranteed Quality</h4>
                    <p className="text-muted-foreground text-sm font-medium italic">We stand by every component we replace with our industry-leading guarantee.</p>
                  </div>
                  <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 h-10 border-primary/20 hover:bg-primary hover:text-white transition-all">
                    Learn about warranty
                  </Button>
                </Card>
              </div>

              <div className="bg-card text-card-foreground border-2 dark:border-white/20 border-black/10 rounded-[40px] p-8 md:p-12 shadow-xl shadow-primary/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                   <div className="space-y-2">
                     <h2 className="text-3xl font-black tracking-tight uppercase">Service <span className="text-primary text-gradient-primary">Directory</span></h2>
                     <p className="text-muted-foreground text-sm font-medium italic">Explore specialized repair categories for precise maintenance.</p>
                   </div>
                   <div className="flex items-center gap-4">
                      {/* Optional status pill or filter */}
                      <div className="flex items-center gap-2 bg-muted border-2 dark:border-white/20 border-black/10 px-4 py-2 rounded-full">
                         <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Stations Online</span>
                      </div>
                   </div>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[32px]" />
                    ))}
                  </div>
                ) : (
                  renderCategoryGrid()
                )}
              </div>
            </motion.div>
          )}

          {view === 'brands' && (
            <motion.div
              key="brands"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-card text-card-foreground border-2 dark:border-white/20 border-black/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5">
                {renderBrandGrid()}
              </div>
            </motion.div>
          )}

          {view === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {renderWizard()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceCenterPage;
