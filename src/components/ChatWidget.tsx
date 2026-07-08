import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { MessageSquare, X, Send, User, Bot, Paperclip, Mic, Smile, ChevronDown, Minimize2, Maximize2, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import { chatService, Message, ChatSession } from "@/api/chatService";
import { repairService } from "@/api/repairService";
import { useLocation, useNavigate } from "react-router-dom";

interface ChatPayload {
  type?: 'repair' | 'product';
  category?: string;
  brand?: string;
  model?: string;
  component?: string;
  description?: string;
  serviceType?: string;
  // Product specific
  productName?: string;
  productPrice?: string;
  productUrl?: string;
  productImage?: string;
}

declare global {
  interface Window {
    openChat?: (payload?: ChatPayload) => void;
  }
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ChatPayload | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob, url: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ 
    left: -window.innerWidth, 
    right: 0, 
    top: -window.innerHeight, 
    bottom: 0 
  });
  const [position, setPosition] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('chat-widget-position') : null;
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const isAdminOrStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setConstraints({
          left: -window.innerWidth + rect.width + 24,
          right: 0,
          top: -window.innerHeight + rect.height + 24,
          bottom: 0
        });
      }
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    const timeout = setTimeout(updateConstraints, 100);
    return () => {
      window.removeEventListener('resize', updateConstraints);
      clearTimeout(timeout);
    };
  }, [isOpen, isMinimized]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number, y: number } }) => {
    const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPos);
    localStorage.setItem('chat-widget-position', JSON.stringify(newPos));
  };

  // Custom Event Listener for opening chat
  useEffect(() => {
    const handleOpenChat = (event?: Event) => {
      if (!user) {
        toast.error("Please sign up to chat with our support team", {
          description: "You'll be redirected to the signup page."
        });
        navigate("/signup");
        return;
      }
      const customEvent = event as CustomEvent;
      const payload = customEvent?.detail;
      
      console.log("ChatWidget: Received open-chat event", payload ? "with payload" : "without payload");
      
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
      
      if (payload) {
        setPendingPayload(payload);
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      toast.success("Opening live chat...", {
        description: "How can we help you today?",
        duration: 2000
      });
    };

    const handleGlobalOpenChat = (payload?: ChatPayload) => {
      if (!user) {
        toast.error("Please sign up to chat with our support team", {
          description: "You'll be redirected to the signup page."
        });
        navigate("/signup");
        return;
      }
      console.log("ChatWidget: Global openChat called", payload ? "with payload" : "without payload");
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
      
      if (payload) {
        setPendingPayload(payload);
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      toast.success("Opening live chat...", {
        description: "How can we help you today?",
        duration: 2000
      });
    };

    window.addEventListener("open-chat", handleOpenChat);
    window.openChat = handleGlobalOpenChat;

    return () => {
      window.removeEventListener("open-chat", handleOpenChat);
      delete window.openChat;
    };
  }, [user, navigate]);

  // Handle Pending Payloads (e.g. Product Queries)
  useEffect(() => {
    if (sessionId && pendingPayload && isOpen) {
      const sendPayload = async () => {
        const payload = pendingPayload;
        setPendingPayload(null);

        let formattedMessage = "";
        let metadata: Record<string, unknown> = {};

        if (payload.type === 'product' || payload.productName) {
          formattedMessage = `I have a question about this product: ${payload.productName} (${payload.productPrice})`;
          metadata = {
            productName: payload.productName,
            productPrice: payload.productPrice,
            productUrl: payload.productUrl,
            productImage: payload.productImage,
            type: 'product'
          };
        } else {
          formattedMessage = `I need help with a repair request: ${payload.category} (${payload.brand} ${payload.model})`;
          metadata = {
            ...payload,
            type: 'repair'
          };
        }

        // 1. Send User Message with metadata
        await chatService.sendMessage(sessionId, formattedMessage, "user", metadata);
      };

      sendPayload();
    }
  }, [sessionId, pendingPayload, isOpen, user]);

  // Handle Pending Messages (e.g. from Service Center)
  useEffect(() => {
    if (sessionId && pendingMessage && isOpen) {
      const sendPending = async () => {
        const msg = pendingMessage;
        setPendingMessage(null); // Clear it first to avoid loops
        
        // 1. Send User Message
        await chatService.sendMessage(sessionId, msg, "user");
      };

      sendPending();
    }
  }, [sessionId, pendingMessage, isOpen, user]);

  // Session Initialization
  useEffect(() => {
    if (authLoading) return;

    const initSession = async () => {
      try {
        const userId = user?.id || localStorage.getItem("guest_chat_id") || `guest_${Math.random().toString(36).substr(2, 9)}`;
        const userName = user?.name || user?.email?.split('@')[0] || localStorage.getItem("guest_chat_name") || "Guest";
        if (!user && !localStorage.getItem("guest_chat_id")) {
          localStorage.setItem("guest_chat_id", userId);
          localStorage.setItem("guest_chat_name", userName);
        }
        
        const sid = await chatService.getOrCreateSession(userId, user?.email, userName);
        setSessionId(sid);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
      }
    };

    initSession();
  }, [user, authLoading]);

  // Real-time Sync
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = chatService.subscribeToMessages(sessionId, (msgs) => {
      const latestId = msgs.length > 0 ? msgs[msgs.length - 1]?.id : undefined;
      const hasNewMessage = latestId && latestId !== lastMessageIdRef.current;
      lastMessageIdRef.current = latestId;
      setMessages(msgs);
      if (!isOpen && hasNewMessage) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => unsubscribe();
  }, [sessionId, isOpen]);

  // Auto-scroll to bottom - FIXED VERSION
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string, attachments?: string[], skipAI: boolean = false, metadata?: Record<string, unknown>) => {
    const text = textOverride || inputValue;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    if (!sessionId) return;

    if (!textOverride) setInputValue("");
    
    // 1. Send User Message
    await chatService.sendMessage(sessionId, text, "user", metadata, attachments);

    // AI response is handled by backend + Celery
  };

  const quickReplies = [
    { label: "Check Status", text: "What is the status of my repair?" },
    { label: "Book Repair", text: "I want to book a new repair." },
    { label: "Talk to Human", text: "I'd like to speak with a human agent." },
    { label: "Pricing", text: "How much does a screen repair cost?" }
  ];

  const handleQuickReply = (text: string) => {
    setInputValue(text);
    // Optional: auto-send
    // handleSend();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !sessionId) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const path = `chats/${sessionId}/${Date.now()}_${file.name}`;
      return await chatService.uploadFile(file, path);
    });

    try {
      const urls = await Promise.all(uploadPromises);
      await handleSend(`Sent ${files.length} file(s)`, urls, true);
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio data captured");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ blob: audioBlob, url: audioUrl });
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    audioChunksRef.current = [];
  };

  const sendVoiceMessage = async () => {
    if (!recordedAudio || !sessionId) return;

    const mimeType = recordedAudio.blob.type;
    const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
    const path = `chats/${sessionId}/${Date.now()}_voice_note.${extension}`;
    
    setIsUploading(true);
    try {
      const url = await chatService.uploadFile(recordedAudio.blob, path);
      await handleSend("Voice message", [url], false, { type: "audio" });
      toast.success("Voice message sent");
      setRecordedAudio(null);
    } catch (error) {
      console.error("Voice upload failed:", error);
      toast.error("Failed to send voice message");
    } finally {
      setIsUploading(false);
      audioChunksRef.current = [];
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderProductCard = (metadata: Record<string, unknown> | null | undefined) => {
    if (!metadata || metadata.type !== 'product') return null;

    const productName = metadata.productName as string;
    const productPrice = metadata.productPrice as string;
    const productUrl = metadata.productUrl as string;
    const productImage = metadata.productImage as string;

    return (
      <div className="mt-3 bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-md max-w-[260px] group/card transition-all hover:shadow-lg hover:border-primary/40">
        {productImage && (
          <div className="h-40 w-full bg-slate-50 flex items-center justify-center p-3 relative overflow-hidden">
            <img 
              src={productImage} 
              alt={productName} 
              className="h-full w-full object-contain transition-transform duration-500 group-hover/card:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur-sm">Product Info</Badge>
            </div>
          </div>
        )}
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-black text-foreground line-clamp-2 leading-tight">{productName}</h4>
          <div className="flex items-center justify-between">
            <p className="text-primary font-black text-sm tracking-tighter">{productPrice}</p>
            <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <Check size={8} />
              In Stock
            </div>
          </div>
          <a 
            href={productUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] mt-3"
          >
            <Eye size={12} />
            View Details
          </a>
        </div>
      </div>
    );
  };

  const renderAttachments = (attachments?: string[], metadata?: Record<string, unknown>) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((url, i) => {
          const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || url.includes("image");
          const isVideo = url.match(/\.(mp4|webm|ogg|mov|m4v)/i) || url.includes("video");
          const isAudio = (url.match(/\.(mp3|wav|m4a|aac|opus)/i) || url.includes("audio") || url.includes("voice_note") || metadata?.type === 'audio') && !isVideo;
          
          if (isImage) {
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block relative group">
                <img src={url} alt="Attachment" className="max-w-full rounded-lg border border-slate-200 shadow-sm transition-all hover:brightness-90" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                      <Maximize2 size={16} />
                   </div>
                </div>
              </a>
            );
          }

          if (isVideo) {
            return (
              <div key={i} className="rounded-lg overflow-hidden border border-slate-200 bg-black/5 max-w-full">
                <video src={url} controls className="max-w-full max-h-[300px]" />
              </div>
            );
          }

          if (isAudio) {
            return (
              <div key={i} className="bg-slate-100 p-2 rounded-lg flex items-center gap-2 border border-slate-200 shadow-sm">
                <audio key={url} controls className="h-8 w-full min-w-[200px]">
                  <source src={url} type={metadata?.mimeType as string | undefined} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            );
          }

          return (
            <a 
              key={i} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl text-xs hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <Paperclip className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold truncate max-w-[150px]">View Attachment</span>
                <span className="text-[10px] opacity-60">File {i + 1}</span>
              </div>
            </a>
          );
        })}
      </div>
    );
  };

  if (isAdminOrStaffRoute) {
    return null;
  }

  if (isMinimized && isOpen) {
    return (
      <motion.div 
        drag
        dragMomentum={false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraints}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          handleDragEnd(e, info);
        }}
        initial={position}
        animate={position}
        ref={containerRef}
        className={`fixed ${isMobile ? 'bottom-24' : 'bottom-6'} right-6 z-[9999] pointer-events-none`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => {
            if (!isDragging) setIsMinimized(false);
          }}
          className="h-12 px-4 rounded-full shadow-xl flex items-center gap-2 bg-primary text-primary-foreground pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Chat Active</span>
          <Maximize2 className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={constraints}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        handleDragEnd(e, info);
      }}
      initial={position}
      animate={position}
      ref={containerRef}
      className={`fixed ${isMobile ? 'bottom-[100px] inset-x-4' : 'bottom-6 right-6'} z-[9999] flex flex-col items-end pointer-events-none`}
      whileDrag={{ scale: 1.02 }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-full sm:w-[350px] md:w-[420px] pointer-events-auto"
          >
            <Card className="shadow-2xl border-primary/20 overflow-hidden flex flex-col h-[500px] sm:h-[600px] max-h-[85vh] rounded-3xl">
              <CardHeader 
                className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground p-5 flex flex-row items-center justify-between shrink-0 cursor-grab active:cursor-grabbing touch-none border-b border-white/10"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center relative">
                    <Bot className="h-6 w-6" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-primary rounded-full" />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-none mb-1">FixItAll Support</CardTitle>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider font-bold">AI Assistant</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary-foreground hover:bg-white/10" 
                    onClick={() => setIsMinimized(true)}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary-foreground hover:bg-white/10" 
                    onClick={() => { setIsOpen(false); setUnreadCount(0); }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              
              {/* FIXED: CardContent with proper overflow handling */}
              <CardContent className="p-0 flex-1 overflow-hidden bg-muted/50 backdrop-blur-sm">
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Scrollable messages container */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4 pb-6">
                      {messages.length === 0 && (
                        <div className="text-center py-8 space-y-4">
                          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <Bot className="text-primary h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm">Welcome to FixItAll Support</h3>
                            <p className="text-xs text-muted-foreground px-8">
                              I'm your AI assistant. I can help with repair status, booking, and technical questions.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex w-full mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-2xl shadow-md relative ${
                            msg.sender === "user" 
                              ? "bg-gradient-to-tr from-[#0061ff] to-[#60efff] text-white rounded-tr-none shadow-blue-500/20" 
                              : (msg.sender === "admin" || msg.sender === "human")
                              ? "bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-tl-none shadow-orange-500/20"
                              : "bg-gradient-to-tr from-background to-secondary/50 dark:from-slate-800 dark:to-slate-900 text-foreground rounded-tl-none border border-border shadow-xl shadow-black/5"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {msg.sender === "assistant" && <Bot className="h-3 w-3 opacity-80" />}
                              {(msg.sender === "admin" || msg.sender === "human") && <User className="h-3 w-3 opacity-80" />}
                              <span className={`text-[9px] font-black uppercase tracking-widest ${msg.sender === "user" ? "text-white/80" : "text-primary/70"}`}>
                                {msg.sender === "user" ? "YOU" : (msg.sender === "admin" || msg.sender === "human") ? "AGENT" : "FIXITALL AI"}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap break-words leading-relaxed overflow-hidden text-sm">
                              {msg.sender === "user" ? msg.text : <Markdown>{msg.text}</Markdown>}
                            </div>
                            {renderProductCard(msg.metadata)}
                            {renderAttachments(msg.attachments, msg.metadata)}
                            <div className={`text-[8px] font-medium mt-1 px-1 ${msg.sender === "user" ? "text-white/60 text-right" : "text-muted-foreground text-left"}`}>
                              {msg.timestamp ? (typeof msg.timestamp.toDate === 'function' ? msg.timestamp.toDate() : new Date(msg.timestamp as string | number | Date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-card border border-border p-2 rounded-xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" />
                              <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Quick Replies - Fixed position */}
                  <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t border-border/50">
                    {quickReplies.map((reply, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="whitespace-nowrap rounded-full text-[10px] h-7 bg-card/80 hover:bg-primary hover:text-primary-foreground transition-all border-primary/20"
                        onClick={() => handleQuickReply(reply.text)}
                      >
                        {reply.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 border-t bg-card shrink-0">
                <div className="flex flex-col w-full gap-2">
                  <div className="flex w-full items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-full shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isRecording}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    {isRecording ? (
                      <div className="flex-1 flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                        <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-rose-600 flex-1">Recording... {formatDuration(recordingDuration)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-rose-600 hover:bg-rose-100"
                          onClick={stopRecording}
                        >
                          Stop
                        </Button>
                      </div>
                    ) : recordedAudio ? (
                      <div className="flex-1 flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-2xl border border-primary/10">
                        <audio src={recordedAudio.url} controls className="h-8 flex-1 max-w-[180px]" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                          onClick={cancelRecording}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          className="h-8 w-8 rounded-full shadow-md bg-primary text-primary-foreground shrink-0"
                          onClick={sendVoiceMessage}
                          disabled={isUploading}
                        >
                          {isUploading ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-3 w-3" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 relative">
                        <Input 
                          ref={inputRef}
                          placeholder="Type your message..." 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSend()}
                          className="bg-muted border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl pr-10 h-10 text-sm placeholder:text-muted-foreground/50"
                          disabled={isUploading}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {!inputValue.trim() && !isRecording && !recordedAudio ? (
                      <Button 
                        variant="ghost"
                        size="icon" 
                        className="h-10 w-10 rounded-full hover:bg-muted text-muted-foreground shrink-0" 
                        onClick={startRecording}
                        disabled={isUploading}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    ) : !recordedAudio && (
                      <Button 
                        size="icon" 
                        className="h-10 w-10 rounded-full shadow-md transition-transform active:scale-95 shrink-0" 
                        onClick={() => handleSend()} 
                        disabled={(!inputValue.trim() && !isRecording) || !sessionId || isTyping || isUploading}
                      >
                        {isUploading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground opacity-60">
                    FixItAll AI can make mistakes. Please verify important info.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => {
          if (isDragging) return;
          
          if (!user) {
            toast.error("Please sign up to chat with our support team", {
              description: "You'll be redirected to the signup page."
            });
            navigate("/signup");
            return;
          }

          console.log("Floating button clicked, current isOpen:", isOpen);
          setIsOpen(!isOpen);
          setIsMinimized(false);
          setUnreadCount(0);
        }}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:shadow-primary/30 transition-all relative group pointer-events-auto cursor-grab active:cursor-grabbing touch-none border border-white/20"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        
        {unreadCount > 0 && !isOpen && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 border-2 border-background animate-in zoom-in">
            {unreadCount}
          </Badge>
        )}
        
        <div className="absolute right-full mr-4 bg-card text-foreground px-3 py-1.5 rounded-lg shadow-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border">
          Need help? Chat with us!
        </div>
      </motion.button>
    </motion.div>
  );
};