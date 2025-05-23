'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { 
  FaUser, FaSearch, FaEllipsisV, FaPaperPlane, FaSmile, 
  FaPaperclip, FaMicrophone, FaHome, FaComments, FaChartLine,
  FaFileAlt, FaCog, FaUsers, FaFilter, FaSave, FaSync, FaPhone,
  FaQuestion, FaCheck, FaTags
} from 'react-icons/fa';
import NewChatModal from '@/components/NewChatModal';
import ManageLabelsModal from '@/components/ManageLabelsModal';
import { Message, Chat, User, Label } from '@/types/chat';

export default function ChatsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filtered, setFiltered] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [manageLabelsModalOpen, setManageLabelsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Reference to IndexedDB service
  const [indexedDBService, setIndexedDBService] = useState<any>(null);

  // For tracking visible messages and marking them as read
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const messageObserverRef = useRef<IntersectionObserver | null>(null);
  const unreadMessageRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Dynamically import IndexedDB service
  useEffect(() => {
    // Only import in browser environment
    const loadIndexedDBService = async () => {
      // Only attempt import in browser environment
      if (typeof window !== 'undefined') {
        try {
          const module = await import('@/lib/indexedDb');
          setIndexedDBService(module.indexedDBService);
          console.log('IndexedDB service loaded');
        } catch (error: any) {
          console.error('Failed to load IndexedDB service:', error);
        }
      } else {
        console.log('Skipping IndexedDB initialization in server environment');
      }
    };
    
    loadIndexedDBService();
  }, []);
  
  // Initialize realtime service when user is available
  useEffect(() => {
    if (!user || !indexedDBService) return;
    
    // Fetch initial chats
    const fetchInitialChats = async () => {
    try {
      setLoadingChats(true);
      
      // First try to get chats from IndexedDB
      try {
        const cachedChats = await indexedDBService.getAllChats();
        if (cachedChats && cachedChats.length > 0) {
          console.log('Retrieved chats from IndexedDB:', cachedChats);
          setChats(cachedChats);
          
          // Update filtered chats based on search query
          if (!searchQuery.trim()) {
            setFilteredChats(cachedChats);
          } else {
            const query = searchQuery.toLowerCase();
            const filtered = cachedChats.filter((chat: Chat) => {
              if (chat.name?.toLowerCase().includes(query)) return true;
              if (chat.participants?.some((p: User) => p.full_name.toLowerCase().includes(query))) return true;
              if (chat.participants?.some((p: User) => p.phone?.includes(query))) return true;
              if (chat.lastMessage?.content.toLowerCase().includes(query)) return true;
              return false;
            });
            setFilteredChats(filtered);
          }
        }
      } catch (dbError: any) {
        console.error('Error fetching chats from IndexedDB:', dbError);
      }
      
      // Then fetch from API
      const response = await fetch('/api/chats');
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      
      // Store chats in IndexedDB
      try {
        await indexedDBService.storeChats(data.chats || []);
        console.log('Chats stored in IndexedDB');
      } catch (dbError: any) {
        console.error('Error storing chats in IndexedDB:', dbError);
      }
      
      setChats(data.chats || []);
      
      // Update filtered chats based on search query
      if (!searchQuery.trim()) {
        setFilteredChats(data.chats || []);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = (data.chats || []).filter((chat: Chat) => {
          if (chat.name?.toLowerCase().includes(query)) return true;
          if (chat.participants?.some((p: User) => p.full_name.toLowerCase().includes(query))) return true;
          if (chat.participants?.some((p: User) => p.phone?.includes(query))) return true;
          if (chat.lastMessage?.content.toLowerCase().includes(query)) return true;
          return false;
        });
        setFilteredChats(filtered);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoadingChats(false);
    }
  };

    fetchInitialChats();
    
    // Set up server-side EventSource for realtime updates
    const eventSource = new EventSource('/api/subscribe');
    
    // Listen for chat updates
    eventSource.addEventListener('chat_update', (event: MessageEvent) => {
      console.log('Chats updated, refreshing');
      fetchInitialChats();
    });
    
    // Listen for new messages that affect chats
    eventSource.addEventListener('message_affects_chat', (event: MessageEvent) => {
      console.log('New message affecting chats, refreshing chat list');
      fetchInitialChats();
    });
    
    // Listen for subscription status updates
    eventSource.addEventListener('subscription_status', (event: MessageEvent) => {
      const status = JSON.parse(event.data);
      console.log('Subscription status:', status);
    });
    
    // Listen for server errors
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const errorData = JSON.parse(event.data || '{}');
        console.error('Server reported error:', errorData.message);
      } catch (err) {
        console.error('Error parsing server error:', err);
      }
    });
    
    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('EventSource connection failed:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
        // The browser will automatically attempt to reconnect when we create a new EventSource
      }, 5000);
    };
    
    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [user, searchQuery, indexedDBService]);

  // Filter chats based on search query
  useEffect(() => {
    if (!chats.length) {
      setFilteredChats([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredChats(chats);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = chats.filter(chat => {
      // Search in chat name
      if (chat.name?.toLowerCase().includes(query)) return true;
      
      // Search in participant names
      if (chat.participants?.some(p => p.full_name.toLowerCase().includes(query))) return true;
      
      // Search in participant phone numbers
      if (chat.participants?.some(p => p.phone?.includes(query))) return true;
      
      // Search in last message content
      if (chat.lastMessage?.content.toLowerCase().includes(query)) return true;
      
      return false;
    });
    
    setFilteredChats(filtered);
  }, [chats, searchQuery]);

  // Handle message search - using the API for message search still makes sense
  useEffect(() => {
    if (!selectedChat) return;
    
    // If not in search mode or search query is empty, just show all messages
    if (!isSearchOpen || !messageSearchQuery.trim()) {
      setFilteredMessages(chatMessages);
      return;
    }
    
    // If search query exists, fetch messages with search from API
    const fetchSearchResults = async () => {
      try {
        setLoadingMessages(true);
        const response = await fetch(`/api/messages?chatId=${selectedChat}&search=${encodeURIComponent(messageSearchQuery.trim())}`);
        
        if (!response.ok) {
          throw new Error('Failed to search messages');
        }
        
        const data = await response.json();
        setFilteredMessages(data.messages || []);
      } catch (error) {
        console.error('Error searching messages:', error);
        setError('Failed to search messages. Please try again.');
      } finally {
        setLoadingMessages(false);
      }
    };
    
    // Debounce the search to avoid too many API calls
    const timerId = setTimeout(() => {
      fetchSearchResults();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [selectedChat, messageSearchQuery]);

  // When a chat is selected, fetch initial messages and subscribe to realtime updates
  useEffect(() => {
    if (!selectedChat || !indexedDBService) return;
    
    // Fetch initial messages
    const fetchInitialMessages = async () => {
      try {
        setLoadingMessages(true);
        
        // First try to get messages from IndexedDB
        if (indexedDBService) {
          try {
            if (selectedChat) {
              const cachedMessages = await indexedDBService.getMessagesByChatId(selectedChat);
              if (cachedMessages && cachedMessages.length > 0) {
                console.log(`Retrieved ${cachedMessages.length} messages from IndexedDB for chat ${selectedChat}`);
                setChatMessages(cachedMessages);
                setFilteredMessages(cachedMessages);
              }
            }
          } catch (dbError: any) {
            console.error('Error fetching messages from IndexedDB:', dbError);
          }
        }
        
        // Then fetch from API
        const response = await fetch(`/api/messages?chatId=${selectedChat}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        // Add chatId property to each message for IndexedDB storage
        const messagesWithChatId = (data.messages || []).map((msg: any) => ({
          ...msg,
          chatId: selectedChat
        }));
        
        // Store messages in IndexedDB
        if (indexedDBService) {
          try {
            if (messagesWithChatId.length > 0) {
              await indexedDBService.storeMessages(messagesWithChatId);
              console.log(`Stored ${messagesWithChatId.length} messages in IndexedDB for chat ${selectedChat}`);
            }
          } catch (dbError: any) {
            console.error('Error storing messages in IndexedDB:', dbError);
          }
        }
        
        setChatMessages(messagesWithChatId);
        setFilteredMessages(messagesWithChatId);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchInitialMessages();
    
    // Set up server-side EventSource for realtime message updates
    const eventSource = new EventSource(`/api/subscribe?chatId=${selectedChat}`);
    
    // Listen for new messages
    eventSource.addEventListener('new_message', (event: MessageEvent) => {
      const payload = JSON.parse(event.data);
      console.log('New message received:', payload);
      
      // Check if the payload has the expected structure
      const messageId = payload.new?.id || payload.id;
      
      if (!messageId) {
        console.error('Invalid message payload:', payload);
        return fetchInitialMessages(); // Fall back to full refresh
      }
      
      // Instead of refetching all messages, just get the new message details
      fetch(`/api/messages/${messageId}`)
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            // Update the isSent property based on the current user
            const newMessage = {
              ...data.message,
              isSent: data.message.sender_id === user?.id,
              chatId: selectedChat // Add chatId for IndexedDB storage
            };
            
            // Store the new message in IndexedDB
            if (indexedDBService) {
              try {
                indexedDBService.storeMessage(newMessage)
                  .then(() => {
                    console.log(`Stored new message in IndexedDB: ${newMessage.id}`);
                  })
                  .catch((dbError: any) => {
                    console.error('Error storing new message in IndexedDB:', dbError);
                  });
              } catch (dbError: any) {
                console.error('Error storing new message in IndexedDB:', dbError);
              }
            }
            
            // Replace any temporary message or add this as a new message
            setChatMessages(prevMessages => {
              // Try to find and replace a temporary message
              const hasTempMessage = prevMessages.some(msg => msg.id.toString().startsWith('temp-'));
              
              if (hasTempMessage) {
                // Replace the first temporary message with the real one
                return prevMessages.map(msg => 
                  msg.id.toString().startsWith('temp-') ? newMessage : msg
                );
              } else {
                // Just add the new message
                return [...prevMessages, newMessage];
              }
            });
            
            // Do the same for filtered messages
            setFilteredMessages(prevMessages => {
              const hasTempMessage = prevMessages.some(msg => msg.id.toString().startsWith('temp-'));
              
              if (hasTempMessage) {
                return prevMessages.map(msg => 
                  msg.id.toString().startsWith('temp-') ? newMessage : msg
                );
              } else {
                return [...prevMessages, newMessage];
              }
            });
          }
        })
        .catch(error => {
          console.error('Error fetching new message details:', error);
          // Fall back to full refetch only if getting the message details fails
          fetchInitialMessages();
        });
    });
    
    // Listen for read receipts
    eventSource.addEventListener('message_read', (event: MessageEvent) => {
      const payload = JSON.parse(event.data);
      console.log('Message read notification:', payload);
      
      if (payload.new && payload.new.id) {
        // Update the read status of this message locally
        setChatMessages(prevMessages => {
          const updatedMessages = prevMessages.map(msg => 
            msg.id === payload.new.id ? { ...msg, isRead: true } : msg
          );
          
          // Update message in IndexedDB
          if (indexedDBService) {
            const updatedMessage = updatedMessages.find(msg => msg.id === payload.new.id);
            if (updatedMessage) {
              try {
                // Ensure message has chatId (required for IndexedDB)
                const messageWithChatId = {
                  ...updatedMessage,
                  chatId: selectedChat || updatedMessage.chatId || ''
                };
                
                indexedDBService.storeMessage(messageWithChatId)
                  .then(() => {
                    console.log(`Updated message read status in IndexedDB: ${messageWithChatId.id}`);
                  })
                  .catch((dbError: any) => {
                    console.error('Error updating message read status in IndexedDB:', dbError);
                  });
              } catch (dbError: any) {
                console.error('Error updating message read status in IndexedDB:', dbError);
              }
            }
          }
          
          return updatedMessages;
        });
        
        setFilteredMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === payload.new.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    });
    
    // Listen for subscription status updates
    eventSource.addEventListener('subscription_status', (event: MessageEvent) => {
      const status = JSON.parse(event.data);
      console.log('Message subscription status:', status);
    });
    
    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };
    
    // Cleanup: close EventSource when component unmounts or chat changes
    return () => {
      eventSource.close();
    };
  }, [selectedChat, user?.id, indexedDBService]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Set the first chat as selected by default
  useEffect(() => {
    if (chats.length > 0 && !selectedChat && !loadingChats) {
      setSelectedChat(chats[0].id);
    }
  }, [chats, selectedChat, loadingChats]);

  // Set up intersection observer to track which messages are visible
  useEffect(() => {
    // Cleanup previous observer
    if (messageObserverRef.current) {
      messageObserverRef.current.disconnect();
    }
    
    // Create a new observer
    messageObserverRef.current = new IntersectionObserver(
      (entries) => {
        // Track newly visible messages
        const newVisibleMessages = new Set(visibleMessages);
        let hasNewVisibleMessages = false;
        
        entries.forEach(entry => {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId && entry.isIntersecting && !newVisibleMessages.has(messageId)) {
            newVisibleMessages.add(messageId);
            hasNewVisibleMessages = true;
          }
        });
        
        // Update visible messages state if changed
        if (hasNewVisibleMessages) {
          setVisibleMessages(newVisibleMessages);
        }
      },
      { threshold: 0.5 } // Message is considered visible when 50% is in view
    );
    
    // Observe all unread message elements
    Object.entries(unreadMessageRefs.current).forEach(([messageId, element]) => {
      if (element) {
        messageObserverRef.current?.observe(element);
      }
    });
    
    return () => {
      messageObserverRef.current?.disconnect();
    };
  }, [chatMessages, visibleMessages]);
  
  // Mark messages as read when they become visible
  useEffect(() => {
    if (!selectedChat || !user || visibleMessages.size === 0) return;
    
    // Get unread, non-sent messages (messages from others) that are now visible
    const unreadMessageIds = chatMessages
      .filter(msg => 
        !msg.isSent && 
        !msg.isRead && 
        visibleMessages.has(msg.id) &&
        !msg.id.toString().startsWith('temp-')
      )
      .map(msg => msg.id);
    
    if (unreadMessageIds.length === 0) return;
    
    // Mark these messages as read locally first
    setChatMessages(prevMessages => {
      const updatedMessages = prevMessages.map(msg => 
        unreadMessageIds.includes(msg.id) 
          ? { ...msg, isRead: true } 
          : msg
      );
      
      // Update read status in IndexedDB for each updated message
      if (indexedDBService) {
        updatedMessages
          .filter(msg => unreadMessageIds.includes(msg.id))
          .forEach(msg => {
            try {
              indexedDBService.storeMessage(msg)
                .then(() => {
                  console.log(`Updated read status in IndexedDB for message: ${msg.id}`);
                })
                .catch((dbError: any) => {
                  console.error('Error updating read status in IndexedDB:', dbError);
                });
            } catch (dbError: any) {
              console.error('Error updating read status in IndexedDB:', dbError);
            }
          });
      }
      
      return updatedMessages;
    });
    
    setFilteredMessages(prevMessages => 
      prevMessages.map(msg => 
        unreadMessageIds.includes(msg.id) 
          ? { ...msg, isRead: true } 
          : msg
      )
    );
    
    // Send read status to server
    fetch('/api/messages/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageIds: unreadMessageIds,
        chatId: selectedChat
      }),
    })
    .then(response => {
      if (!response.ok) {
        console.error('Failed to mark messages as read');
      }
    })
    .catch(error => {
      console.error('Error marking messages as read:', error);
    });
    
  }, [selectedChat, user, visibleMessages, chatMessages]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    // Store message text before clearing input
    const messageText = message;
    
    // Clear the input field immediately for better UX
    setMessage('');
    
    // Create an optimistic message to show immediately
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      text: messageText,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
      sender: user.email || 'You',
      sender_id: user.id,
      email: user.email,
      isSent: true,
      isDelivered: false,
      isRead: false,
      message_type: 'text',
      is_forwarded: false,
      chatId: selectedChat // Add chatId for IndexedDB storage
    };
    
    // Add optimistic message to UI immediately
    setChatMessages(prev => [...prev, optimisticMessage]);
    setFilteredMessages(prev => [...prev, optimisticMessage]);
    
    // Store optimistic message in IndexedDB
    if (indexedDBService) {
      try {
        await indexedDBService.storeMessage(optimisticMessage);
        console.log(`Stored optimistic message in IndexedDB: ${optimisticId}`);
      } catch (dbError: any) {
        console.error('Error storing optimistic message in IndexedDB:', dbError);
      }
    }
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat,
          content: messageText,
          messageType: 'text'
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Remove the optimistic message on error
        setChatMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        setFilteredMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        
        // Also remove from IndexedDB
        if (indexedDBService) {
          try {
            await indexedDBService.deleteMessage(optimisticId);
            console.log(`Removed failed message from IndexedDB: ${optimisticId}`);
          } catch (dbError: any) {
            console.error('Error removing failed message from IndexedDB:', dbError);
          }
        }
        
        throw new Error(data.error || 'Failed to send message');
      }
      
      // The real message will be added by the realtime subscription,
      // and we'll keep the optimistic message until then
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // If still loading or no user, show loading state
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [date: string]: Message[] } = {};
    
    // Create a copy for sorting to ensure messages appear in chronological order
    const sortedMessages = [...filteredMessages].sort((a, b) => {
      // Special case for temporary messages (keep them at the end of their date group)
      if (a.id.toString().startsWith('temp-') && !b.id.toString().startsWith('temp-')) {
        return 1; // temp messages come last
      } else if (!a.id.toString().startsWith('temp-') && b.id.toString().startsWith('temp-')) {
        return -1; // non-temp messages come first
      }
      
      // If same date, sort by time
      if (a.date === b.date) {
        const timeA = new Date(`${a.date} ${a.time}`).getTime();
        const timeB = new Date(`${b.date} ${b.time}`).getTime();
        return timeA - timeB;
      }
      
      // Otherwise sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Group sorted messages by date
    sortedMessages.forEach(msg => {
      if (!groups[msg.date]) {
        groups[msg.date] = [];
      }
      groups[msg.date].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Handle new chat creation
  const handleChatCreated = (chatId: string) => {
    // Select the new chat - the realtime service will update the chat list
    setSelectedChat(chatId);
  };

  return (
    <div className="flex h-screen">
      {/* New Chat Modal */}
      <NewChatModal 
        isOpen={newChatModalOpen} 
        onClose={() => setNewChatModalOpen(false)} 
        onChatCreated={handleChatCreated}
      />
      
      {/* Left sidebar with navigation icons */}
      <div className="w-16 bg-white border-r flex flex-col items-center py-4">
        <div className="w-10 h-10 mb-8">
          <Image 
            src="/download.png" 
            alt="Periskope Logo" 
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col space-y-6 items-center flex-1">
          <button className="p-3 text-black hover:text-gray-800">
            <FaHome size={20} />
          </button>
          <button className="p-3 text-green-600 hover:text-green-700 relative">
            <FaComments size={20} />
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {chats.reduce((acc, chat) => acc + (chat.unread || 0), 0)}
            </span>
          </button>
          <button className="p-3 text-black hover:text-gray-800">
            <FaChartLine size={20} />
          </button>
          <button className="p-3 text-black hover:text-gray-800">
            <FaFileAlt size={20} />
          </button>
          <button className="p-3 text-black hover:text-gray-800">
            <FaUsers size={20} />
          </button>
        </div>
        <button className="p-3 text-black hover:text-gray-800 mt-auto" onClick={logout}>
          <FaCog size={20} />
        </button>
      </div>

      {/* Chats sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-3 border-b flex justify-between items-center bg-white">
          <div className="flex items-center">
            <h1 className="font-medium text-sm text-gray-600">CHATS</h1>
          </div>
          <div className="flex space-x-3">
            <button className="text-black hover:text-gray-800" onClick={() => setNewChatModalOpen(true)}>
              +
            </button>
            <button className="text-black hover:text-gray-800">
              <FaQuestion />
            </button>
            <div className="flex items-center text-xs text-black">
              <span className="text-yellow-500 mr-1">●</span>
              5 / 5 phones
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-2 border-b flex items-center space-x-2 bg-gray-50 text-xs">
          <button className="px-3 py-1 rounded-md text-xs border border-green-600 text-green-600 flex items-center">
            <FaFilter className="mr-1" />
            <span>Custom filter</span>
          </button>
          <button className="px-3 py-1 rounded-md text-xs border border-gray-300 text-gray-600">
            <FaSave className="mr-1" />
            Save
          </button>
          <button 
            className="px-3 py-1 rounded-md text-xs border border-gray-300 text-gray-600 flex items-center"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <FaSearch className="mr-1" />
            Search
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs ${filtered ? 'bg-green-50 text-green-600 border border-green-100' : 'border border-gray-300 text-gray-600'} flex items-center`}
            onClick={() => setFiltered(!filtered)}
          >
            <span>Filtered</span>
            <FaFilter className={`ml-1 ${filtered ? 'text-green-500' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Search input for chats */}
        {searchOpen && (
          <div className="p-2 border-b bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {searchQuery && (
                <button 
                  className="absolute right-2 top-2 text-black hover:text-gray-800"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto bg-white relative">
          {/* Floating new chat button */}
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          </div>
          
          {loadingChats ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-pulse text-black">Loading chats...</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-black">
                {searchQuery ? 'No matching chats found' : 'No chats found'}
              </div>
            </div>
          ) : (
            filteredChats.map((chat) => (
            <div 
              key={chat.id}
              className={`flex p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-gray-100' : ''}`}
              onClick={() => setSelectedChat(chat.id)}
            >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 relative mr-3">
                  {(chat.name || 'Unknown').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{chat.name || chat.participants?.[0]?.full_name || 'Unknown Chat'}</h3>
                    <span className="text-xs text-black whitespace-nowrap">
                      {chat.lastMessage ? formatDate(chat.lastMessage.created_at) : formatDate(chat.created_at)}
                    </span>
                </div>
                  <p className="text-xs text-black truncate">
                    {chat.lastMessage ? (
                      <>
                        {chat.lastMessage.sender_id !== user.id && (
                          <span className="font-medium">{chat.lastMessage.sender_name}: </span>
                        )}
                        {chat.lastMessage.content}
                      </>
                    ) : (
                      <span className="italic text-black">No messages yet</span>
                    )}
                </p>
                <div className="flex mt-1 items-center">
                    <span className="text-xs text-black mr-2 whitespace-nowrap">
                      {chat.participants?.filter(p => p.id !== user.id)[0]?.phone || ''}
                    </span>
                    {/* Display labels if available */}
                    {chat.labels && chat.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mr-auto">
                        {chat.labels.map(label => (
                          <span 
                            key={label.id} 
                            className="text-xs px-2 py-0.5 rounded" 
                            style={{ 
                              backgroundColor: label.color ? `${label.color}20` : '#e5e7eb',
                              color: label.color || '#4b5563'
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {chat.unread > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      +{chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {selectedChat ? (
          <>
            <div className="p-3 border-b flex justify-between items-center bg-white">
              <div className="flex items-center">
                {loadingMessages ? (
                  <div className="animate-pulse w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                    {(chats.find(c => c.id === selectedChat)?.name || 'U').charAt(0).toUpperCase()}
                </div>
                )}
                <div>
                  {loadingMessages ? (
                    <div className="animate-pulse h-4 w-24 bg-gray-200 rounded mb-1"></div>
                  ) : (
                    <h2 className="font-medium text-sm">
                      {chats.find(c => c.id === selectedChat)?.name || 
                       chats.find(c => c.id === selectedChat)?.participants?.filter(p => p.id !== user.id)[0]?.full_name || 
                       'Unknown Chat'}
                    </h2>
                  )}
                  {loadingMessages ? (
                    <div className="animate-pulse h-3 w-32 bg-gray-200 rounded"></div>
                  ) : (
                    <p className="text-xs text-black flex items-center">
                      {chats.find(c => c.id === selectedChat)?.participants?.filter(p => p.id !== user.id)[0]?.phone || ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="flex -space-x-2">
                  {/* Profile pictures of participants */}
                  {chats.find(c => c.id === selectedChat)?.participants?.slice(0, 3).map((participant, index) => (
                    <div key={participant.id} className={`w-7 h-7 rounded-full bg-gray-${300 + (index * 50)} border-2 border-white flex items-center justify-center text-xs`}>
                      {participant.full_name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(chats.find(c => c.id === selectedChat)?.participants?.length || 0) > 3 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                      +{(chats.find(c => c.id === selectedChat)?.participants?.length || 0) - 3}
                    </div>
                  )}
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 text-black">
                  <FaPhone size={18} />
                </button>
                <button 
                  className="p-2 rounded-full hover:bg-gray-100 text-black"
                  onClick={() => {
                    // Toggle search visibility
                    if (isSearchOpen) {
                      // Close search
                      setIsSearchOpen(false);
                      setMessageSearchQuery('');
                      // Reset to original messages without search
                      setLoadingMessages(true);
                      fetch(`/api/messages?chatId=${selectedChat}`)
                        .then(res => res.json())
                        .then(data => {
                          setChatMessages(data.messages || []);
                          setFilteredMessages(data.messages || []);
                          setLoadingMessages(false);
                        })
                        .catch(err => {
                          console.error('Error refreshing messages:', err);
                          setLoadingMessages(false);
                        });
                    } else {
                      // Open search with empty string to start
                      setIsSearchOpen(true);
                      setMessageSearchQuery('');
                    }
                  }}
                >
                  <FaSearch size={18} />
                </button>
                <button 
                  className="p-2 rounded-full hover:bg-gray-100 text-black"
                  onClick={() => setManageLabelsModalOpen(true)}
                >
                  <FaTags size={18} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-black">
                  <FaEllipsisV size={18} />
                </button>
              </div>
            </div>

            {/* Message search */}
            <div className={`bg-white p-2 border-b transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'max-h-16' : 'max-h-0'}`}>
              <div className="relative">
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  autoFocus={isSearchOpen}
                />
                <button 
                  className="absolute right-2 top-2 text-black hover:text-gray-800"
                  onClick={() => {
                    setMessageSearchQuery('');
                    if (messageSearchQuery.trim()) {
                      // If there was a search query, refetch all messages
                      setLoadingMessages(true);
                      fetch(`/api/messages?chatId=${selectedChat}`)
                        .then(res => res.json())
                        .then(data => {
                          setChatMessages(data.messages || []);
                          setFilteredMessages(data.messages || []);
                          setLoadingMessages(false);
                        })
                        .catch(err => {
                          console.error('Error refreshing messages:', err);
                          setLoadingMessages(false);
                        });
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 relative">
              {/* Refresh messages button */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => {
                    if (selectedChat) {
                      // If we're searching, refresh the search results
                      if (isSearchOpen && messageSearchQuery.trim()) {
                        const searchUrl = `/api/messages?chatId=${selectedChat}&search=${encodeURIComponent(messageSearchQuery.trim())}`;
                        setLoadingMessages(true);
                        fetch(searchUrl)
                          .then(res => res.json())
                          .then(data => {
                            setFilteredMessages(data.messages || []);
                            setLoadingMessages(false);
                          })
                          .catch(err => {
                            console.error('Error refreshing search results:', err);
                            setLoadingMessages(false);
                          });
                      } else {
                        // Otherwise refresh all messages
                        setLoadingMessages(true);
                        fetch(`/api/messages?chatId=${selectedChat}`)
                          .then(res => res.json())
                          .then(data => {
                            setChatMessages(data.messages || []);
                            setFilteredMessages(data.messages || []);
                            setLoadingMessages(false);
                          })
                          .catch(err => {
                            console.error('Error refreshing messages:', err);
                            setLoadingMessages(false);
                          });
                      }
                    }
                  }}
                  className="p-2 rounded-full bg-white text-black hover:text-gray-800 shadow-md"
                  title={isSearchOpen && messageSearchQuery.trim() ? "Refresh search results" : "Refresh messages"}
                >
                  <FaSync className={loadingMessages ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse text-black">Loading messages...</div>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-black">No messages yet</div>
                  </div>
              ) : filteredMessages.length === 0 && isSearchOpen ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-black">No messages match your search</div>
                </div>
              ) : (
                Object.entries(groupMessagesByDate()).map(([date, messages]) => (
                  <div key={date}>
              {/* Date marker */}
                    <div className="flex justify-center mb-4">
                <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                        {date}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    {messages.map((msg, index) => (
                      <div 
                        key={msg.id} 
                        className={`mb-3 ${msg.isSent ? 'flex justify-end' : 'flex items-start'}`}
                        data-message-id={msg.id}
                        ref={el => {
                          // Only track non-sent, unread messages for visibility
                          if (!msg.isSent && !msg.isRead && !msg.id.toString().startsWith('temp-')) {
                            unreadMessageRefs.current[msg.id] = el;
                          } else {
                            // Clean up references that are no longer needed
                            if (unreadMessageRefs.current[msg.id]) {
                              delete unreadMessageRefs.current[msg.id];
                            }
                          }
                        }}
                      >
                        {!msg.isSent && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-2">
                            {msg.sender.charAt(0).toUpperCase()}
                  </div>
                        )}
                        <div className={`max-w-md ${msg.isSent ? '' : 'ml-2'}`}>
                          {/* Show sender info for incoming messages or for the first message in a sequence */}
                          {(!msg.isSent || (index > 0 && messages[index - 1].isSent !== msg.isSent)) && (
                            <div className={`text-xs text-black mb-1 ${msg.isSent ? 'flex justify-end' : ''}`}>
                              {msg.sender} {msg.phoneNumber && <span className="text-black ml-1">{msg.phoneNumber}</span>}
                </div>
                          )}
                          <div className={`${msg.isSent ? 'bg-green-50' : 'bg-white'} p-3 rounded-lg`}>
                            <p className="text-gray-800">{msg.text}</p>
                            <div className={`${msg.isSent ? 'flex justify-between' : ''} items-center mt-1`}>
                              {msg.email && msg.isSent && (
                                <span className="text-xs text-black">{msg.email}</span>
                              )}
                              <div className={`flex items-center ${!msg.isSent ? 'justify-end' : ''}`}>
                                <span className="text-xs text-black mr-1">{msg.time}</span>
                                {msg.isSent && (
                                  <span className="text-green-500 flex items-center">
                                    {msg.id.toString().startsWith('temp-') ? (
                                      <span className="text-xs text-black italic">sending...</span>
                                    ) : (
                                      <>
                                        <FaCheck className="inline" />
                                        {msg.isRead && <FaCheck className="inline -ml-1" />}
                                      </>
                                    )}
                                  </span>
                                )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-3 py-2 border-t bg-white flex items-center">
              <button className="p-2 text-black hover:text-gray-800">
                <FaSmile className="text-xl" />
              </button>
              <button className="p-2 text-black hover:text-gray-800">
                <FaPaperclip className="text-xl" />
              </button>
              <input
                type="text"
                className="flex-1 border-0 bg-gray-100 rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-1 focus:ring-green-500 text-black"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="p-2 text-black hover:text-gray-800">
                <FaMicrophone className="text-xl" />
              </button>
              <button 
                className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700"
                onClick={sendMessage}
                disabled={!message.trim()}
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-500 mb-2">Select a chat to start messaging</h2>
              <p className="text-gray-400">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>

      {/* Manage Labels Modal */}
      {selectedChat && (
        <ManageLabelsModal
          isOpen={manageLabelsModalOpen}
          onClose={() => setManageLabelsModalOpen(false)}
          chatId={selectedChat}
          chatName={chats.find(c => c.id === selectedChat)?.name || 'Unknown Chat'}
          onLabelApplied={() => {}}
        />
      )}
    </div>
  );
} 