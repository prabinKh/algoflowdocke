import { useState, useEffect, useRef } from "react";
import { chatService, Message, ChatSession } from "@/api/chatService";
import { 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  Check, 
  CheckCheck, 
  Clock,
  MoreVertical,
  Phone,
  Video,
  Info,
  Circle,
  Paperclip,
  Mic,
  ArrowLeft,
  X as LucideX,
  Play,
  Pause
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { safeToDate } from "@/lib/utils";

const AdminMessages = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob, url: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, { current: number, duration: number }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Fetch all active sessions with polling
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await chatService.getSessions();
        const uniqueSessions = sessionsData.filter((s, index, self) =>
          index === self.findIndex((t) => t.id === s.id)
        );
        const validSessions = uniqueSessions.filter(s => 
          (s.lastMessage && s.lastMessage.trim() !== "") || 
          (s.unreadAdminCount && s.unreadAdminCount > 0)
        );
        setSessions(validSessions.filter(s => s.status === "active"));
        setLoading(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!errorMsg.includes("starting up or offline")) {
          toast.error("Failed to load conversations");
        }
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected session
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const unsubscribe = chatService.subscribeToMessages(selectedSession.id, (msgs) => {
      setMessages(msgs);
      if (selectedSession.unreadAdminCount && selectedSession.unreadAdminCount > 0) {
        chatService.markSessionAsRead(selectedSession.id);
      }
    });

    return () => unsubscribe();
  }, [selectedSession]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (textOverride?: string, attachments?: string[], metadata?: Record<string, unknown>) => {
    const text = textOverride || inputValue;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    if (!selectedSession) return;

    if (!textOverride) setInputValue("");
    
    try {
      await chatService.sendMessage(selectedSession.id, text, "admin", metadata, attachments);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedSession) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const path = `chats/${selectedSession.id}/${Date.now()}_${file.name}`;
      return await chatService.uploadFile(file, path);
    });

    try {
      const urls = await Promise.all(uploadPromises);
      await handleSend(`Sent ${files.length} file(s)`, urls);
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
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
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
    if (!recordedAudio || !selectedSession) return;

    const mimeType = recordedAudio.blob.type;
    const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
    const path = `chats/${selectedSession.id}/${Date.now()}_voice_note.${extension}`;
    
    setIsUploading(true);
    try {
      const url = await chatService.uploadFile(recordedAudio.blob, path);
      await handleSend("Voice message", [url], { type: "audio", mimeType, duration: recordingDuration });
      toast.success("Voice message sent");
      setRecordedAudio(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error("Voice upload failed:", error);
      toast.error("Failed to send voice message");
    } finally {
      setIsUploading(false);
      audioChunksRef.current = [];
    }
  };

  const formatDuration = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = (audioId: string) => {
    const audioElement = audioRefs.current.get(audioId);
    if (!audioElement) {
      console.warn("Audio element not found for:", audioId);
      return;
    }

    // Pause any other currently playing audio
    if (playingAudioId && playingAudioId !== audioId) {
      const prevAudio = audioRefs.current.get(playingAudioId);
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }
    
    if (playingAudioId === audioId) {
      audioElement.pause();
      setPlayingAudioId(null);
      return;
    }

    const attemptPlay = () => {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingAudioId(audioId);
          })
          .catch((e) => {
            console.error("Play failed:", e);
            const err = audioElement.error;
            if (err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
              toast.error("Audio format not supported by this browser");
            } else if (err?.code === MediaError.MEDIA_ERR_NETWORK) {
              toast.error("Network error loading audio");
            } else {
              toast.error("Unable to play audio");
            }
            setPlayingAudioId(null);
          });
      } else {
        setPlayingAudioId(audioId);
      }
    };

    // If the element previously errored out, force it to reload before retrying
    if (audioElement.error || audioElement.networkState === audioElement.NETWORK_NO_SOURCE) {
      audioElement.load();
      const handleCanPlay = () => {
        audioElement.removeEventListener('canplay', handleCanPlay);
        attemptPlay();
      };
      audioElement.addEventListener('canplay', handleCanPlay);
    } else {
      attemptPlay();
    }
  };

  const VoiceMessagePlayer = ({ url, mimeType, messageId, duration: propDuration }: { url: string; mimeType?: string; messageId: string; duration?: number }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlaying = playingAudioId === messageId;
    const progress = audioProgress[messageId] || { current: 0, duration: propDuration || 0 };

    // Register/unregister this audio element in the shared ref map
    useEffect(() => {
      const audio = audioRef.current;
      if (audio) {
        audioRefs.current.set(messageId, audio);
      }
      return () => {
        audioRefs.current.delete(messageId);
      };
    }, [messageId]);

    // Attach playback event listeners
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
        const current = audio.currentTime || 0;
        const duration = (isFinite(audio.duration) ? audio.duration : propDuration) || 0;
        setAudioProgress(prev => ({ 
          ...prev, 
          [messageId]: { current, duration }
        }));
      };

      const handleLoadedMetadata = () => {
        const duration = (isFinite(audio.duration) ? audio.duration : propDuration) || 0;
        setAudioProgress(prev => ({ 
          ...prev, 
          [messageId]: { current: prev[messageId]?.current || 0, duration }
        }));
      };

      const handleEnded = () => {
        setPlayingAudioId(prev => (prev === messageId ? null : prev));
        setAudioProgress(prev => ({ 
          ...prev, 
          [messageId]: { current: 0, duration: prev[messageId]?.duration || propDuration || 0 } 
        }));
      };

      const handleError = () => {
        const err = audio.error;
        let reason = "Unknown error";
        if (err) {
          switch (err.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              reason = "Playback aborted";
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              reason = "Network error while loading audio";
              break;
            case MediaError.MEDIA_ERR_DECODE:
              reason = "Audio could not be decoded (unsupported codec)";
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              reason = "Audio source not supported (check CORS / file URL)";
              break;
          }
        }
        console.error("Failed to load audio:", url, reason, err);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }, [messageId, propDuration, url]);

    return (
      <div className="flex items-center gap-3 bg-muted/50 rounded-full px-3 py-1.5 w-max">
        <audio ref={audioRef} preload="metadata">
          {mimeType && <source src={url} type={mimeType} />}
          <source src={url} />
        </audio>
        <button
          type="button"
          onClick={() => handleAudioPlay(messageId)}
          className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0"
        >
          {isPlaying ? (
            <Pause size={12} className="text-white" />
          ) : (
            <Play size={12} className="text-white ml-0.5" />
          )}
        </button>
        <div className="w-24 h-1 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-100"
            style={{ width: `${progress.duration > 0 ? (progress.current / progress.duration) * 100 : 0}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {formatDuration(progress.current)} / {formatDuration(progress.duration)}
        </span>
      </div>
    );
  };

  const renderProductCard = (metadata: Record<string, unknown> | null | undefined) => {
    if (!metadata || metadata.type !== 'product') return null;

    const productName = metadata.productName as string;
    const productPrice = metadata.productPrice as string;
    const productUrl = metadata.productUrl as string;
    const productImage = metadata.productImage as string;

    return (
      <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm max-w-[240px]">
        {productImage && (
          <div className="h-32 w-full bg-accent flex items-center justify-center p-2">
            <img 
              src={productImage} 
              alt={productName} 
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="p-3 space-y-1 text-left">
          <h4 className="text-xs font-bold text-foreground line-clamp-2">{productName}</h4>
          <p className="text-emerald-500 font-bold text-xs">{productPrice}</p>
          <a 
            href={productUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full text-center py-1.5 bg-accent hover:bg-accent/50 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors mt-2"
          >
            View Product
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
          const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes("image");
          const isAudio = metadata?.type === 'audio' || url.match(/\.(mp3|wav|webm|ogg|m4a|mp4|aac)/i) || url.includes("audio") || url.includes("voice_note");
          
          if (isImage) {
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img src={url} alt="Attachment" className="max-w-[200px] rounded-lg border border-border shadow-sm hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
              </a>
            );
          }

          if (isAudio) {
            const messageId = `audio_${url}`;
            return (
              <VoiceMessagePlayer 
                key={i}
                url={url} 
                mimeType={metadata?.mimeType as string} 
                messageId={messageId}
                duration={metadata?.duration as number}
              />
            );
          }

          return (
            <a 
              key={i} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 p-2 bg-muted rounded-lg text-xs hover:bg-accent transition-colors"
            >
              <Paperclip className="h-3 w-3" />
              <span className="truncate max-w-[150px]">View Attachment</span>
            </a>
          );
        })}
      </div>
    );
  };

  const filteredSessions = sessions.filter(session => 
    (session.userName || "Guest").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-card relative">
      {/* Sidebar - Chat List */}
      <div className={`
        ${selectedSession ? 'hidden md:flex' : 'flex'} 
        w-full md:w-80 lg:w-96 border-r border-border flex-col shrink-0
      `}>
        <div className="p-4 border-b border-border space-y-4">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="text-emerald-500" size={20} />
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading chats...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-4 flex items-start gap-3 transition-all hover:bg-muted text-left ${
                    selectedSession?.id === session.id ? "bg-emerald-50/50" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-muted-foreground font-bold text-lg">
                      {(session.userName || "G").charAt(0)}
                    </div>
                    {session.unreadAdminCount && session.unreadAdminCount > 0 ? (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                        {session.unreadAdminCount}
                      </span>
                    ) : (
                      <Circle className="absolute -bottom-0.5 -right-0.5 text-emerald-500 fill-emerald-500 border-2 border-white rounded-full" size={12} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-foreground truncate">{session.userName || "Guest"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(() => {
                          const date = safeToDate(session.updatedAt);
                          return date ? format(date, "HH:mm") : "";
                        })()}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-medium truncate mb-0.5">
                      {session.userEmail ? session.userEmail : (session.userId ? `ID: ${session.userId.substring(0, 8)}...` : "Anonymous")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={`
        ${!selectedSession ? 'hidden md:flex' : 'flex'} 
        flex-1 flex-col bg-muted/30
      `}>
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <header className="h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-muted rounded-full text-muted-foreground"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                  {(selectedSession.userName || "G").charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-foreground leading-tight">{selectedSession.userName || "Guest"}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Online</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50">|</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {selectedSession.userEmail ? selectedSession.userEmail : (selectedSession.userId ? `ID: ${selectedSession.userId}` : "Anonymous")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors">
                  <Video size={18} />
                </button>
                <div className="w-px h-6 bg-accent mx-1" />
                <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors">
                  <Info size={18} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === "admin" || msg.sender === "human";
                  const isAI = msg.sender === "assistant" || msg.sender === "ai";
                  
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                          isMe 
                            ? "bg-emerald-500 text-white rounded-tr-none" 
                            : isAI
                            ? "bg-accent text-muted-foreground rounded-tl-none border border-border italic"
                            : "bg-card text-foreground rounded-tl-none border border-border"
                        }`}>
                          {msg.text && msg.text.trim() !== "" && msg.text !== "Voice message" && (
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          )}
                          {renderProductCard(msg.metadata)}
                          {renderAttachments(msg.attachments, msg.metadata)}
                        </div>
                        <div className={`flex items-center gap-1.5 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {(() => {
                              const date = safeToDate(msg.timestamp);
                              return date ? format(date, "HH:mm") : "Just now";
                            })()}
                          </span>
                          {isMe && <CheckCheck size={12} className="text-emerald-500" />}
                          {!isMe && !isAI && <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">User</span>}
                          {isAI && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">AI Assistant</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 bg-card border-t border-border shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                  multiple
                />
                <button 
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isRecording}
                >
                  <Paperclip size={20} />
                </button>

                {isRecording ? (
                  <div className="flex-1 flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-2 bg-rose-500 animate-[pulse_1s_ease-in-out_infinite]" />
                        <div className="w-0.5 h-3 bg-rose-500 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                        <div className="w-0.5 h-2 bg-rose-500 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 flex-1">Recording... {formatDuration(recordingDuration)}</span>
                    <button 
                      className="text-xs font-bold text-rose-600 hover:underline"
                      onClick={stopRecording}
                    >
                      Stop
                    </button>
                  </div>
                ) : recordedAudio ? (
                  <div className="flex-1 flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Mic size={16} className="text-emerald-500" />
                      <span className="text-xs text-emerald-700 font-medium">
                        Voice note ({formatDuration(recordingDuration)})
                      </span>
                    </div>
                    <audio src={recordedAudio.url} controls className="h-8 flex-1 max-w-[150px]" />
                    <button 
                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-full transition-colors"
                      onClick={cancelRecording}
                    >
                      <LucideX size={14} />
                    </button>
                    <button 
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      onClick={sendVoiceMessage}
                      disabled={isUploading}
                    >
                      {isUploading ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Send"}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      disabled={isUploading}
                    />
                  </div>
                )}
                
                {!recordedAudio && !inputValue.trim() && !isRecording && (
                  <button 
                    className={`p-2 rounded-xl transition-colors text-muted-foreground hover:bg-muted hover:text-emerald-500`}
                    onClick={startRecording}
                    disabled={isUploading}
                    title="Send voice message"
                  >
                    <Mic size={20} />
                  </button>
                )}
                
                {!isRecording && !recordedAudio && (
                  <button 
                    onClick={() => handleSend()}
                    disabled={(!inputValue.trim()) || !selectedSession || isUploading}
                    className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                    {isUploading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500">
              <MessageSquare size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Select a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a chat from the sidebar to start messaging with your customers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;