import { useEffect, useRef, useState } from "react";
import { Paperclip, Play, Pause, Maximize2, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export type AttachmentKind = "image" | "video" | "audio" | "file";

export interface AttachmentMeta {
  url?: string;
  type?: AttachmentKind | string;
  mimeType?: string;
  name?: string;
  duration?: number;
}

/** Resolve relative /media URLs so audio/video/img elements can load them. */
export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;

  if (url.includes("127.0.0.1") || url.includes("localhost")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  if (url.startsWith("/media/")) return url;

  const apiBase = import.meta.env.VITE_API_URL || "/api";
  if (apiBase.startsWith("http")) {
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
    } catch {
      return url;
    }
  }

  return url.startsWith("/") ? url : `/${url}`;
}

export function detectAttachmentType(
  url: string,
  metadata?: Record<string, unknown> | null,
  index = 0
): AttachmentKind {
  const attachmentsMeta = metadata?.attachmentsMeta as AttachmentMeta[] | undefined;
  const perFile = attachmentsMeta?.[index];
  const typeHint = (perFile?.type || metadata?.type) as string | undefined;
  const mimeHint = (perFile?.mimeType || metadata?.mimeType) as string | undefined;
  const lowerUrl = url.toLowerCase();

  if (
    typeHint === "audio" ||
    mimeHint?.startsWith("audio/") ||
    lowerUrl.includes("voice_note")
  ) {
    return "audio";
  }

  if (typeHint === "video" || mimeHint?.startsWith("video/")) {
    return "video";
  }

  if (typeHint === "image" || mimeHint?.startsWith("image/")) {
    return "image";
  }

  const ext = lowerUrl.split("?")[0].split(".").pop() || "";
  if (/^(jpe?g|gif|png|webp|avif|svg|bmp)$/.test(ext)) return "image";
  if (/^(mp4|mov|m4v|avi|mkv)$/.test(ext)) return "video";
  if (ext === "webm") {
    return typeHint === "audio" || lowerUrl.includes("voice_note") ? "audio" : "video";
  }
  if (/^(mp3|wav|m4a|aac|ogg|opus|flac)$/.test(ext)) return "audio";

  return "file";
}

export function getAttachmentLabel(
  url: string,
  metadata?: Record<string, unknown> | null,
  index = 0
): string {
  const attachmentsMeta = metadata?.attachmentsMeta as AttachmentMeta[] | undefined;
  const name = attachmentsMeta?.[index]?.name;
  if (name) return name;

  const segment = url.split("?")[0].split("/").pop();
  if (segment) return decodeURIComponent(segment.replace(/^\d+_/, ""));

  return `Attachment ${index + 1}`;
}

export function inferFileMeta(file: File | Blob, filename?: string): AttachmentMeta {
  const mimeType = file.type || "application/octet-stream";
  const name = filename || (file instanceof File ? file.name : "upload");

  if (mimeType.startsWith("image/")) return { type: "image", mimeType, name };
  if (mimeType.startsWith("video/")) return { type: "video", mimeType, name };
  if (mimeType.startsWith("audio/")) return { type: "audio", mimeType, name };
  return { type: "file", mimeType, name };
}

export function buildAttachmentsMetadata(files: File[], urls?: string[]): Record<string, unknown> {
  const attachmentsMeta = files.map((file, index) => ({
    ...inferFileMeta(file),
    ...(urls?.[index] ? { url: urls[index] } : {}),
  }));
  const primaryType = attachmentsMeta.length === 1 ? attachmentsMeta[0].type : "file";
  return { type: primaryType, attachmentsMeta };
}

const formatDuration = (seconds: number) => {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface VoiceMessagePlayerProps {
  url: string;
  mimeType?: string;
  messageId: string;
  duration?: number;
  variant?: "admin" | "widget";
  playingAudioId?: string | null;
  onPlayStateChange?: (id: string | null) => void;
  audioRefs?: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  audioProgress?: Record<string, { current: number; duration: number }>;
  onProgressChange?: (id: string, progress: { current: number; duration: number }) => void;
}

export const VoiceMessagePlayer = ({
  url,
  mimeType,
  messageId,
  duration: propDuration,
  variant = "widget",
  playingAudioId,
  onPlayStateChange,
  audioRefs,
  audioProgress,
  onProgressChange,
}: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localProgress, setLocalProgress] = useState({ current: 0, duration: propDuration || 0 });

  const resolvedUrl = resolveMediaUrl(url);
  const isSharedMode = Boolean(audioRefs && onPlayStateChange);
  const isPlaying = isSharedMode ? playingAudioId === messageId : localPlaying;
  const progress = isSharedMode
    ? audioProgress?.[messageId] || { current: 0, duration: propDuration || 0 }
    : localProgress;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isSharedMode || !audioRefs) return;

    audioRefs.current.set(messageId, audio);
    return () => {
      audioRefs.current.delete(messageId);
    };
  }, [messageId, isSharedMode, audioRefs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const next = {
        current: audio.currentTime || 0,
        duration: (isFinite(audio.duration) ? audio.duration : propDuration) || 0,
      };
      if (isSharedMode && onProgressChange) {
        onProgressChange(messageId, next);
      } else {
        setLocalProgress(next);
      }
    };

    const handleLoadedMetadata = () => {
      const next = {
        current: isSharedMode ? audioProgress?.[messageId]?.current || 0 : localProgress.current,
        duration: (isFinite(audio.duration) ? audio.duration : propDuration) || 0,
      };
      if (isSharedMode && onProgressChange) {
        onProgressChange(messageId, next);
      } else {
        setLocalProgress(next);
      }
    };

    const handleEnded = () => {
      if (isSharedMode && onPlayStateChange) {
        onPlayStateChange(null);
      } else {
        setLocalPlaying(false);
      }
      const reset = { current: 0, duration: progress.duration || propDuration || 0 };
      if (isSharedMode && onProgressChange) {
        onProgressChange(messageId, reset);
      } else {
        setLocalProgress(reset);
      }
    };

    const handleError = () => {
      console.error("Failed to load audio:", resolvedUrl, audio.error);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [messageId, propDuration, resolvedUrl, isSharedMode, onPlayStateChange, onProgressChange]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isSharedMode && audioRefs && onPlayStateChange) {
      if (playingAudioId && playingAudioId !== messageId) {
        const prev = audioRefs.current.get(playingAudioId);
        prev?.pause();
        prev && (prev.currentTime = 0);
      }

      if (playingAudioId === messageId) {
        audio.pause();
        onPlayStateChange(null);
        return;
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => onPlayStateChange(messageId))
          .catch((e) => {
            console.error("Play failed:", e);
            toast.error("Unable to play audio");
            onPlayStateChange(null);
          });
      } else {
        onPlayStateChange(messageId);
      }
      return;
    }

    if (localPlaying) {
      audio.pause();
      setLocalPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => setLocalPlaying(true))
      .catch((e) => {
        console.error("Play failed:", e);
        toast.error("Unable to play audio");
      });
  };

  const shellClass =
    variant === "admin"
      ? "flex items-center gap-3 bg-muted/50 rounded-full px-3 py-1.5 w-max"
      : "bg-slate-100 p-2 rounded-lg flex items-center gap-2 border border-slate-200 shadow-sm w-full max-w-full";

  return (
    <div className={shellClass}>
      <audio ref={audioRef} preload="metadata">
        {mimeType && <source src={resolvedUrl} type={mimeType} />}
        <source src={resolvedUrl} />
      </audio>
      <button
        type="button"
        onClick={handlePlay}
        className={`${
          variant === "admin"
            ? "w-7 h-7 bg-emerald-500 hover:bg-emerald-600"
            : "w-8 h-8 bg-primary hover:bg-primary/90"
        } rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0`}
      >
        {isPlaying ? (
          <Pause size={variant === "admin" ? 12 : 14} className="text-white" />
        ) : (
          <Play
            size={variant === "admin" ? 12 : 14}
            className={`text-white ${variant === "admin" ? "ml-0.5" : ""}`}
          />
        )}
      </button>
      <div className={`${variant === "admin" ? "w-24" : "flex-1 min-w-[80px]"} h-1 bg-gray-300 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${variant === "admin" ? "bg-emerald-500" : "bg-primary"} transition-all duration-100`}
          style={{
            width: `${progress.duration > 0 ? (progress.current / progress.duration) * 100 : 0}%`,
          }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono tabular-nums whitespace-nowrap">
        {formatDuration(progress.current)} / {formatDuration(progress.duration)}
      </span>
    </div>
  );
};

interface UniversalFilePreviewProps {
  url: string;
  metadata?: Record<string, unknown> | null;
  index?: number;
  variant?: "admin" | "widget";
  messageId?: string;
  playingAudioId?: string | null;
  onPlayStateChange?: (id: string | null) => void;
  audioRefs?: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  audioProgress?: Record<string, { current: number; duration: number }>;
  onProgressChange?: (id: string, progress: { current: number; duration: number }) => void;
}

export const UniversalFilePreview = ({
  url,
  metadata,
  index = 0,
  variant = "widget",
  messageId,
  playingAudioId,
  onPlayStateChange,
  audioRefs,
  audioProgress,
  onProgressChange,
}: UniversalFilePreviewProps) => {
  const resolvedUrl = resolveMediaUrl(url);
  const kind = detectAttachmentType(url, metadata, index);
  const label = getAttachmentLabel(url, metadata, index);
  const attachmentsMeta = metadata?.attachmentsMeta as AttachmentMeta[] | undefined;
  const mimeType = attachmentsMeta?.[index]?.mimeType || (metadata?.mimeType as string | undefined);
  const duration = attachmentsMeta?.[index]?.duration ?? (metadata?.duration as number | undefined);
  const audioId = messageId || `audio_${index}_${url}`;

  if (kind === "image") {
    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group"
      >
        <img
          src={resolvedUrl}
          alt={label}
          className={`${
            variant === "admin" ? "max-w-[200px]" : "max-w-full"
          } rounded-lg border border-border shadow-sm transition-all hover:opacity-90`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
            <Maximize2 size={16} />
          </div>
        </div>
      </a>
    );
  }

  if (kind === "video") {
    return (
      <div className="rounded-lg overflow-hidden border border-border bg-black/5 max-w-full">
        <video
          src={resolvedUrl}
          controls
          playsInline
          preload="metadata"
          className="max-w-full max-h-[300px]"
        >
          <source src={resolvedUrl} type={mimeType} />
        </video>
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <VoiceMessagePlayer
        url={url}
        mimeType={mimeType}
        messageId={audioId}
        duration={duration}
        variant={variant}
        playingAudioId={playingAudioId}
        onPlayStateChange={onPlayStateChange}
        audioRefs={audioRefs}
        audioProgress={audioProgress}
        onProgressChange={onProgressChange}
      />
    );
  }

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={`flex items-center gap-2 ${
        variant === "admin" ? "p-2 bg-muted rounded-lg text-xs hover:bg-accent" : "p-2.5 bg-slate-100 rounded-xl text-xs hover:bg-slate-200 border border-slate-200"
      } transition-colors`}
    >
      {label.match(/\.(pdf|doc|docx|txt)$/i) ? (
        <FileText className={`${variant === "admin" ? "h-3 w-3" : "h-4 w-4 text-primary"}`} />
      ) : (
        <Paperclip className={`${variant === "admin" ? "h-3 w-3" : "h-4 w-4 text-primary"}`} />
      )}
      <div className="flex flex-col min-w-0">
        <span className="font-bold truncate max-w-[180px]">{label}</span>
        <span className="text-[10px] opacity-60 flex items-center gap-1">
          <Download size={10} />
          Download
        </span>
      </div>
    </a>
  );
};

interface MessageAttachmentsProps {
  attachments?: string[];
  metadata?: Record<string, unknown> | null;
  variant?: "admin" | "widget";
  playingAudioId?: string | null;
  onPlayStateChange?: (id: string | null) => void;
  audioRefs?: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  audioProgress?: Record<string, { current: number; duration: number }>;
  onProgressChange?: (id: string, progress: { current: number; duration: number }) => void;
}

export const MessageAttachments = ({
  attachments,
  metadata,
  variant = "widget",
  playingAudioId,
  onPlayStateChange,
  audioRefs,
  audioProgress,
  onProgressChange,
}: MessageAttachmentsProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((url, i) => (
        <UniversalFilePreview
          key={`${url}-${i}`}
          url={url}
          metadata={metadata}
          index={i}
          variant={variant}
          messageId={`attachment_${i}_${url}`}
          playingAudioId={playingAudioId}
          onPlayStateChange={onPlayStateChange}
          audioRefs={audioRefs}
          audioProgress={audioProgress}
          onProgressChange={onProgressChange}
        />
      ))}
    </div>
  );
};
