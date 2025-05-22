// MessageService class for handling real-time message updates using polling
class MessageService {
  private static instance: MessageService;
  private pollingIntervals: { [chatId: string]: NodeJS.Timeout } = {};
  private callbacks: { [chatId: string]: ((messages: any[]) => void)[] } = {};
  private POLLING_INTERVAL = 3000; // 3 seconds

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

    // If no polling interval exists for this chat, create one
    if (!this.pollingIntervals[chatId]) {
      this.pollingIntervals[chatId] = setInterval(async () => {
        try {
          const response = await fetch(`/api/messages?chatId=${chatId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }
          const data = await response.json();
          
          // Notify all callbacks for this chat
          this.callbacks[chatId].forEach(cb => cb(data.messages || []));
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, this.POLLING_INTERVAL);
    }
  }

  public unsubscribeFromChat(chatId: string) {
    // Clear the polling interval
    if (this.pollingIntervals[chatId]) {
      clearInterval(this.pollingIntervals[chatId]);
      delete this.pollingIntervals[chatId];
    }

    // Clear the callbacks
    delete this.callbacks[chatId];
  }

  public unsubscribeFromAll() {
    // Clear all polling intervals
    Object.keys(this.pollingIntervals).forEach(chatId => {
      clearInterval(this.pollingIntervals[chatId]);
    });

    // Reset state
    this.pollingIntervals = {};
    this.callbacks = {};
  }
}

export default MessageService; 