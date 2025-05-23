import { Message, Chat } from '@/types/chat';

// Type definitions to provide type safety
interface DBSchema {
  chats: {
    key: string;
    value: Chat;
  };
  messages: {
    key: string;
    indexes: {
      chatId: string;
    };
    value: Message;
  };
}

class IndexedDBService {
  private static instance: IndexedDBService;
  private dbName = 'periskopeDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isClient = false;

  private constructor() {
    // Check if we're in the browser environment
    this.isClient = typeof window !== 'undefined';
    
    // Only initialize DB in browser environment
    if (this.isClient) {
      this.dbPromise = this.initDB();
    }
  }

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  private async initDB(): Promise<IDBDatabase> {
    // Safety check - ensure we're in browser environment
    if (!this.isClient) {
      return Promise.reject('IndexedDB is only available in browser environment');
    }

    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('Your browser doesn\'t support IndexedDB');
        reject('IndexedDB not supported');
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Successfully connected to IndexedDB');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          console.log('Created chats object store');
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          // Create an index for faster querying messages by chatId
          messageStore.createIndex('chatId', 'chatId', { unique: false });
          console.log('Created messages object store with chatId index');
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    // Safety check - ensure we're in browser environment
    if (!this.isClient) {
      return Promise.reject('IndexedDB is only available in browser environment');
    }
    
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;
    
    this.dbPromise = this.initDB();
    return this.dbPromise;
  }

  // Store a single chat
  public async storeChat(chat: Chat): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chats'], 'readwrite');
        const store = transaction.objectStore('chats');
        
        const request = store.put(chat);
        
        request.onsuccess = () => {
          console.log(`Chat stored in IndexedDB: ${chat.id}`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error storing chat:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error('Failed to store chat:', error);
      throw error;
    }
  }

  // Store multiple chats
  public async storeChats(chats: Chat[]): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['chats'], 'readwrite');
      const store = transaction.objectStore('chats');
      
      for (const chat of chats) {
        store.put(chat);
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Stored ${chats.length} chats in IndexedDB`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error('Error storing chats:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Failed to store chats:', error);
      throw error;
    }
  }

  // Store a single message
  public async storeMessage(message: Message): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        const request = store.put(message);
        
        request.onsuccess = () => {
          console.log(`Message stored in IndexedDB: ${message.id}`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error storing message:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error('Failed to store message:', error);
      throw error;
    }
  }

  // Store multiple messages
  public async storeMessages(messages: Message[]): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      for (const message of messages) {
        store.put(message);
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Stored ${messages.length} messages in IndexedDB`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error('Error storing messages:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Failed to store messages:', error);
      throw error;
    }
  }

  // Get all chats
  public async getAllChats(): Promise<Chat[]> {
    // Return empty array in server environment
    if (!this.isClient) return Promise.resolve([]);
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chats'], 'readonly');
        const store = transaction.objectStore('chats');
        const request = store.getAll();
        
        request.onsuccess = () => {
          console.log(`Retrieved ${request.result.length} chats from IndexedDB`);
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('Error getting chats:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error('Failed to get chats:', error);
      throw error;
    }
  }

  // Get messages by chat ID
  public async getMessagesByChatId(chatId: string): Promise<Message[]> {
    // Return empty array in server environment
    if (!this.isClient) return Promise.resolve([]);
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('chatId');
        const request = index.getAll(chatId);
        
        request.onsuccess = () => {
          console.log(`Retrieved ${request.result.length} messages for chat ${chatId} from IndexedDB`);
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('Error getting messages:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error('Failed to get messages by chat ID:', error);
      throw error;
    }
  }

  // Delete a message by ID
  public async deleteMessage(messageId: string): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        const request = store.delete(messageId);
        
        request.onsuccess = () => {
          console.log(`Message deleted from IndexedDB: ${messageId}`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error deleting message:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }
  
  // Clear all data
  public async clearAll(): Promise<void> {
    // Skip in server environment
    if (!this.isClient) return Promise.resolve();
    
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chats', 'messages'], 'readwrite');
        const chatStore = transaction.objectStore('chats');
        const messageStore = transaction.objectStore('messages');
        
        chatStore.clear();
        messageStore.clear();
        
        transaction.oncomplete = () => {
          console.log('Cleared all data from IndexedDB');
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error('Error clearing data:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const indexedDBService = IndexedDBService.getInstance(); 