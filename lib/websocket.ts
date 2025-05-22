import { createClient } from '@/lib/supabase/client';

type MessageCallback = (messages: any[]) => void;

/**
 * A message polling service that simulates real-time behavior
 * using regular polling instead of WebSockets
 */
class MessageService {
  private static instance: MessageService;
  private supabase = createClient();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, MessageCallback> = new Map();
  private lastMessageTimestamps: Map<string, string> = new Map();
  
  private constructor() {}
  
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }
  
  /**
   * Start polling for new messages in a specific chat
   * @param chatId The ID of the chat to monitor
   * @param callback Function to call when new messages are received
   */
  public subscribeToChat(chatId: string, callback: MessageCallback): void {
    // Stop any existing polling for this chat
    this.unsubscribeFromChat(chatId);
    
    // Store the callback
    this.callbacks.set(chatId, callback);
    
    // Get the current timestamp
    const now = new Date().toISOString();
    this.lastMessageTimestamps.set(chatId, now);
    
    console.log(`Starting message polling for chat ${chatId}`);
    
    // Start polling
    const interval = setInterval(() => {
      this.checkForNewMessages(chatId);
    }, 3000); // Poll every 3 seconds
    
    this.pollingIntervals.set(chatId, interval);
  }
  
  /**
   * Check for new messages in a chat
   * @param chatId The chat ID to check
   */
  private async checkForNewMessages(chatId: string): Promise<void> {
    try {
      const lastTimestamp = this.lastMessageTimestamps.get(chatId);
      
      if (!lastTimestamp) {
        return;
      }
      
      // Fetch messages newer than the last one we've seen
      const { data: messages, error } = await this.supabase
        .from('messages')
        .select(`
          id,
          content,
          message_type,
          is_forwarded,
          created_at,
          sender_id,
          chat_id
        `)
        .eq('chat_id', chatId)
        .gt('created_at', lastTimestamp)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error(`Error polling for messages in chat ${chatId}:`, error);
        return;
      }
      
      // If we have new messages, update the last timestamp and call the callback
      if (messages && messages.length > 0) {
        console.log(`Found ${messages.length} new messages in chat ${chatId}`);
        
        // Update the last message timestamp
        const latestMessage = messages[messages.length - 1];
        this.lastMessageTimestamps.set(chatId, latestMessage.created_at);
        
        // Call the callback with the new messages
        const callback = this.callbacks.get(chatId);
        if (callback) {
          callback(messages);
        }
      }
    } catch (error) {
      console.error(`Error checking for new messages in chat ${chatId}:`, error);
    }
  }
  
  /**
   * Stop polling for a specific chat
   * @param chatId The ID of the chat to stop polling
   */
  public unsubscribeFromChat(chatId: string): void {
    const interval = this.pollingIntervals.get(chatId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(chatId);
      this.callbacks.delete(chatId);
      this.lastMessageTimestamps.delete(chatId);
      console.log(`Stopped message polling for chat ${chatId}`);
    }
  }
  
  /**
   * Stop all polling
   */
  public unsubscribeFromAll(): void {
    this.pollingIntervals.forEach((interval, chatId) => {
      clearInterval(interval);
    });
    
    this.pollingIntervals.clear();
    this.callbacks.clear();
    this.lastMessageTimestamps.clear();
    
    console.log('Stopped all message polling');
  }
}

export default MessageService; 