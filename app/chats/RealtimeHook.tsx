import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

// A custom hook for handling realtime updates safely in Next.js
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
      chatEventSource = new EventSource('/api/subscribe');
      
      // Listen for chat updates
      chatEventSource.addEventListener('chat_update', () => {
        setChatsUpdated(prev => !prev); // Toggle to trigger useEffect in parent
      });
      
      // Listen for new messages that affect chats
      chatEventSource.addEventListener('message_affects_chat', () => {
        setChatsUpdated(prev => !prev);
      });
      
      // Handle errors
      chatEventSource.onerror = (error) => {
        console.error('Chat EventSource failed:', error);
        if (chatEventSource) {
          chatEventSource.close();
          // Try to reconnect after a delay
          setTimeout(setupChatListEventSource, 5000);
        }
      };
    };

    // Function to set up message EventSource (with chat ID)
    const setupMessageEventSource = (chatId: string) => {
      if (messagesEventSource) {
        messagesEventSource.close();
      }
      
      messagesEventSource = new EventSource(`/api/subscribe?chatId=${chatId}`);
      
      // Listen for new messages
      messagesEventSource.addEventListener('new_message', async (event: MessageEvent) => {
        const payload = JSON.parse(event.data);
        if (!payload.new?.id) return;
        
        try {
          // Fetch the complete message from the API
          const response = await fetch(`/api/messages/${payload.new.id}`);
          if (!response.ok) throw new Error('Failed to fetch message details');
          
          const data = await response.json();
          if (data.message) {
            setMessages(prev => [...prev, data.message]);
          }
        } catch (error) {
          console.error('Error fetching message details:', error);
        }
      });
      
      // Listen for message read status updates
      messagesEventSource.addEventListener('message_read', (event: MessageEvent) => {
        const payload = JSON.parse(event.data);
        if (!payload.new?.id) return;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === payload.new.id ? { ...msg, isRead: true } : msg
          )
        );
      });
      
      // Handle errors
      messagesEventSource.onerror = (error) => {
        console.error('Message EventSource failed:', error);
        if (messagesEventSource) {
          messagesEventSource.close();
          // Try to reconnect after a delay
          setTimeout(() => setupMessageEventSource(chatId), 5000);
        }
      };
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