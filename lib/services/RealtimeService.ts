import MessageService from '../websocket';
import { createClient } from '../supabase/client';

class RealtimeService {
  private static instance: RealtimeService;
  private messageService = MessageService.getInstance();
  private supabase = createClient();
  private isInitialized = false;
  private chatSubscription: any = null;
  
  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Initialize realtime subscriptions exactly like in ChatContext.tsx
   */
  public init(userId: string, onChatsUpdate: (chats: any[]) => void): void {
    if (this.isInitialized) return;
    
    // Fetch initial data
    this.fetchChats(onChatsUpdate);
    
    // Set up subscriptions, exactly matching ChatContext.tsx pattern
    this.chatSubscription = this.supabase
      .channel("conversations-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats"
        },
        () => {
          this.fetchChats(onChatsUpdate);
        }
      )
      .subscribe();
    
    this.isInitialized = true;
  }

  /**
   * Fetch chats from the API
   */
  private fetchChats(onChatsUpdate: (chats: any[]) => void): void {
    fetch('/api/chats')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }
        return response.json();
      })
      .then(data => {
        onChatsUpdate(data.chats || []);
      })
      .catch(error => {
        console.error('Error fetching chats:', error);
      });
  }

  /**
   * Subscribe to a specific chat for messages
   */
  public subscribeToChat(chatId: string, onMessagesUpdate: (messages: any[]) => void): void {
    this.messageService.subscribeToChat(chatId, onMessagesUpdate);
  }

  /**
   * Unsubscribe from a specific chat
   */
  public unsubscribeFromChat(chatId: string): void {
    this.messageService.unsubscribeFromChat(chatId);
  }

  /**
   * Clean up all subscriptions
   */
  public cleanup(): void {
    this.messageService.unsubscribeFromAll();
    
    if (this.chatSubscription) {
      this.supabase.removeChannel(this.chatSubscription);
      this.chatSubscription = null;
    }
    
    this.isInitialized = false;
  }
}

export default RealtimeService; 