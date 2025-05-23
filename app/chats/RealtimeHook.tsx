import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

// A custom hook for handling realtime updates safely in Next.js using server-sent events
export function useRealtimeSubscriptions(selectedChatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [chatsUpdated, setChatsUpdated] = useState(false);

  useEffect(() => {
    // Don't set up subscriptions if no user or running on server
    if (!user || typeof window === 'undefined') return;

    let chatEventSource: EventSource | null = null;
    let messagesEventSource: EventSource | null = null;

    // Function to set up chat list EventSource (without chat ID)
    const setupChatListEventSource = () => {
      // Close any existing connection
      if (chatEventSource) {
        chatEventSource.close();
      }
      
      // Open a new connection to the server
      chatEventSource = new EventSource('/api/subscribe');
      
      // Listen for chat updates
      chatEventSource.addEventListener('chat_update', () => {
        setChatsUpdated(prev => !prev); // Toggle to trigger useEffect in parent
      });
      
      // Listen for new messages that affect chats
      chatEventSource.addEventListener('message_affects_chat', () => {
        setChatsUpdated(prev => !prev);
      });
      
      // Handle connection open
      chatEventSource.addEventListener('open', () => {
        console.log('Chat EventSource connection established');
      });
      
      // Handle errors and connection issues
      chatEventSource.addEventListener('error', (event) => {
        console.error('Chat EventSource failed:', event);
        if (chatEventSource && chatEventSource.readyState === EventSource.CLOSED) {
          // Try to reconnect after a delay if the connection is closed
          setTimeout(setupChatListEventSource, 5000);
        }
      });
    };

    // Function to set up message EventSource (with chat ID)
    const setupMessageEventSource = (chatId: string) => {
      // Close any existing connection
      if (messagesEventSource) {
        messagesEventSource.close();
      }
      
      // Open a new connection to the server with chat ID parameter
      messagesEventSource = new EventSource(`/api/subscribe?chatId=${chatId}`);
      
      // Handle connection open
      messagesEventSource.addEventListener('open', () => {
        console.log(`Message EventSource connection established for chat ${chatId}`);
      });
      
      // Listen for new messages
      messagesEventSource.addEventListener('new_message', async (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload.new?.id) return;
          
          // Fetch the complete message from the API
          const response = await fetch(`/api/messages/${payload.new.id}`);
          if (!response.ok) throw new Error('Failed to fetch message details');
          
          const data = await response.json();
          if (data.message) {
            setMessages(prev => [...prev, data.message]);
          }
        } catch (error) {
          console.error('Error processing new message event:', error);
        }
      });
      
      // Listen for message read status updates
      messagesEventSource.addEventListener('message_read', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload.new?.id) return;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, isRead: true } : msg
            )
          );
        } catch (error) {
          console.error('Error processing message read event:', error);
        }
      });
      
      // Handle errors and connection issues
      messagesEventSource.addEventListener('error', (event) => {
        console.error('Message EventSource failed:', event);
        if (messagesEventSource && messagesEventSource.readyState === EventSource.CLOSED) {
          // Try to reconnect after a delay if the connection is closed
          setTimeout(() => setupMessageEventSource(chatId), 5000);
        }
      });
    };

    // Set up chat list subscription first
    setupChatListEventSource();
    
    // Set up message subscription if we have a selected chat
    if (selectedChatId) {
      setupMessageEventSource(selectedChatId);
    }

    // Cleanup function to close all connections
    return () => {
      if (chatEventSource) {
        chatEventSource.close();
      }
      if (messagesEventSource) {
        messagesEventSource.close();
      }
    };
  }, [user, selectedChatId]);

  return { messages, chatsUpdated };
} 