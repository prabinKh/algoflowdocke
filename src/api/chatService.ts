import axiosInstance from "./axiosConfig";
import { uploadService } from "./uploadService";

export interface Message {
  id?: string;
  sender: "user" | "admin" | "system" | "human" | "assistant" | "ai";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "audio" | "file";
  fileUrl?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  msg_type?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  updatedAt?: string;
  status: "active" | "closed" | "handoff" | "archived";
  unreadAdminCount?: number;
  unreadUserCount?: number;
  metadata?: Record<string, unknown>;
}

export const chatService = {
  getSessions: async (): Promise<ChatSession[]> => {
    try {
      const response = await axiosInstance.get("/chat/chat-sessions/");
      return response.data;
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      throw error;
    }
  },

  getMessages: async (sessionId: string): Promise<Message[]> => {
    try {
      const response = await axiosInstance.get("/chat/chat-messages/", {
        params: { session_id: sessionId }
      });
      const data = response.data;
      return data.map((msg: Record<string, unknown>) => ({
        ...msg,
        type: msg.msg_type // Map msg_type to type
      })) as Message[];
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  getOrCreateSession: async (userId: string, userEmail: string | null | undefined, userName: string) => {
    // Try to find existing active session first
    try {
      const searchResponse = await axiosInstance.get("/chat/chat-sessions/", {
        params: { guest_id: userId }
      });
      const existingData = searchResponse.data;
      if (existingData && existingData.length > 0) {
        return existingData[0].id;
      }
    } catch (e) {
      console.warn("Failed to search existing chat session, continuing to create new one:", e);
    }

    try {
      const response = await axiosInstance.post("/chat/chat-sessions/", { 
        user_id_str: userId, 
        user_email: userEmail || "Guest", 
        user_name: userName, 
        status: "active" 
      });
      return response.data.id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }, message?: string };
      console.error("Chat session creation failed:", err.response?.data || err.message);
      throw new Error("Failed to get or create session");
    }
  },

  subscribeToMessages: (sessionId: string, callback: (messages: Message[]) => void) => {
    let lastTimestamp: string | null = null;
    let allMessages: Message[] = [];

    const fetchMessages = async () => {
      try {
        const params: Record<string, string> = { session_id: sessionId };
        if (lastTimestamp) {
          params.since = lastTimestamp;
        }

        const response = await axiosInstance.get("/chat/chat-messages/", { params });
        const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
        const newMessages = data.map((msg: Record<string, unknown>) => ({
          ...msg,
          type: msg.msg_type // Map msg_type to type
        })) as Message[];

        if (newMessages.length > 0) {
          lastTimestamp = newMessages[newMessages.length - 1].timestamp;
          allMessages = [...allMessages, ...newMessages];
          callback(allMessages);
        } else if (!lastTimestamp) {
          // Initial empty load
          callback([]);
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Polling every 2 seconds for deltas
    return () => clearInterval(interval);
  },

  markSessionAsRead: async (sessionId: string) => {
    try {
      await axiosInstance.patch(`/chat/chat-sessions/${sessionId}/`, { 
        unreadAdminCount: 0 
      });
    } catch (error) {
      console.error("Failed to mark session as read:", error);
      throw error;
    }
  },

  sendMessage: async (sessionId: string, text: string, sender: "user" | "admin" | "human" | "assistant" | "ai" = "admin", metadata?: Record<string, unknown>, attachments?: string[]) => {
    const normalizedSender = sender === "ai" ? "assistant" : sender;
    try {
      const response = await axiosInstance.post("/chat/chat-messages/", {
        session: sessionId,
        sender: normalizedSender,
        text,
        msg_type: metadata?.type || "text",
        metadata: metadata || {},
        attachments: attachments || []
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }, message?: string };
      console.error("Failed to send message:", err.response?.data || err.message);
      throw error;
    }
  },

  uploadFile: async (file: Blob | File, path: string) => {
    return uploadService.uploadImage(file, path);
  },

  closeSession: async (sessionId: string) => {
    try {
      await axiosInstance.patch(`/chat/chat-sessions/${sessionId}/`, { 
        status: "closed" 
      });
    } catch (error) {
      console.error("Failed to close session:", error);
      throw error;
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await axiosInstance.delete(`/chat/chat-sessions/${sessionId}/`);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  }
};
