// RealtimeService class for handling real-time updates using Supabase
import { createClient } from './supabase/client';

// MessageService class for handling real-time message updates
class MessageService {
  private static instance: MessageService;
  private callbacks: { [chatId: string]: ((messages: any[]) => void)[] } = {};
  private supabase = createClient();
  private subscription: any = null;

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  public subscribeToChat(chatId: string, callback: (messages: any[]) => void) {
    // Add callback to the list of callbacks for this chat
    if (!this.callbacks[chatId]) {
      this.callbacks[chatId] = [];
    }
    this.callbacks[chatId].push(callback);

    // Fetch initial messages
    this.fetchMessages(chatId);

    // Set up subscription if not already active
    if (!this.subscription) {
      // Create a single channel for all message changes, exactly like in ChatContext.tsx
      this.subscription = this.supabase
        .channel("messages-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMessage = payload.new;
            const messagesChatId = newMessage.chat_id;
            
            // If we have callbacks for this chat, fetch updated messages
            if (this.callbacks[messagesChatId]) {
              this.fetchMessages(messagesChatId);
            }
          }
        )
        .subscribe();
    }
  }

  private async fetchMessages(chatId: string) {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      
      // Notify all callbacks for this chat
      if (this.callbacks[chatId]) {
        this.callbacks[chatId].forEach(cb => cb(data.messages || []));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  public unsubscribeFromChat(chatId: string) {
    // Remove callbacks for this chat
    delete this.callbacks[chatId];
    
    // If no more callbacks, remove subscription
    if (Object.keys(this.callbacks).length === 0 && this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  public unsubscribeFromAll() {
    // Clear subscription
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    
    // Clear callbacks
    this.callbacks = {};
  }
}

export default MessageService; 