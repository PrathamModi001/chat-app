'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  FaUser, FaSearch, FaEllipsisV, FaPaperPlane, FaSmile, 
  FaPaperclip, FaMicrophone, FaHome, FaComments, FaChartLine,
  FaFileAlt, FaCog, FaUsers, FaFilter, FaSave, FaSync, FaPhone,
  FaQuestion, FaCheck
} from 'react-icons/fa';
import MessageService from '@/lib/websocket';
import NewChatModal from '@/components/NewChatModal';

interface User {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  profile_image_url?: string;
}

interface Message {
  id: string;
  text: string;
  time: string;
  sender: string;
  sender_id: string;
  phoneNumber?: string;
  email?: string;
  isSent: boolean;
  date: string;
  isDelivered: boolean;
  isRead: boolean;
  message_type: string;
  is_forwarded: boolean;
  reply_to_message_id?: string;
}

interface Chat {
  id: string;
  name?: string;
  description?: string;
  lastMessage?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender_name: string;
    message_type: string;
    is_forwarded: boolean;
  };
  created_at: string;
  updated_at: string;
  unread: number;
  is_group: boolean;
  chat_type: 'Demo' | 'Internal' | 'Signup' | 'Content' | 'Dont Send';
  participants: User[];
}

export default function ChatsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filtered, setFiltered] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageService = MessageService.getInstance();

  // Function to refresh chats
  const refreshChats = async () => {
    if (!user) return;
    
    try {
      setLoadingChats(true);
      const response = await fetch('/api/chats');
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch chats on mount
  useEffect(() => {
    if (user) {
      refreshChats();
    }
  }, [user]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedChat) return;
      
      try {
        setLoadingMessages(true);
        const response = await fetch(`/api/messages?chatId=${selectedChat}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        setChatMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
    
    // Set up message monitoring for the selected chat
    if (selectedChat) {
      // Subscribe to new messages using our polling service
      messageService.subscribeToChat(selectedChat, (newMessages) => {
        console.log("Received new messages:", newMessages);
        
        // Refresh both messages and chats
        Promise.all([
          fetch(`/api/messages?chatId=${selectedChat}`).then(res => res.json()),
          fetch('/api/chats').then(res => res.json())
        ])
        .then(([messagesData, chatsData]) => {
          setChatMessages(messagesData.messages || []);
          setChats(chatsData.chats || []);
        })
        .catch(err => {
          console.error('Error updating after new messages:', err);
        });
      });
    }

    // Cleanup: unsubscribe when component unmounts or chat changes
    return () => {
      if (selectedChat) {
        messageService.unsubscribeFromChat(selectedChat);
      }
    };
  }, [selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Set the first chat as selected by default
  useEffect(() => {
    if (chats.length > 0 && !selectedChat && !loadingChats) {
      setSelectedChat(chats[0].id);
    }
  }, [chats, selectedChat, loadingChats]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      messageService.unsubscribeFromAll();
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat,
          content: message,
          messageType: 'text'
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      // Add the new message to the chat
      setChatMessages(prev => [...prev, data.message]);
      
      // Clear the input field
      setMessage('');
      
      // Refresh the chat list to show the updated last message
      refreshChats();
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

  // Function to get badge color based on chat type
  const getBadgeColor = (type?: string) => {
    switch (type) {
      case 'Demo': return 'bg-gray-100 text-gray-700';
      case 'Internal': return 'bg-green-50 text-green-600';
      case 'Content': return 'bg-blue-50 text-blue-600';
      case 'Signup': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
    
    chatMessages.forEach(msg => {
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
    // Refresh the chat list
    refreshChats();
    
    // Select the new chat
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
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white mb-8">
          <FaUser />
        </div>
        <div className="flex flex-col space-y-6 items-center flex-1">
          <button className="p-3 text-gray-400 hover:text-gray-600">
            <FaHome size={20} />
          </button>
          <button className="p-3 text-green-600 hover:text-green-700 relative">
            <FaComments size={20} />
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {chats.reduce((acc, chat) => acc + (chat.unread || 0), 0)}
            </span>
          </button>
          <button className="p-3 text-gray-400 hover:text-gray-600">
            <FaChartLine size={20} />
          </button>
          <button className="p-3 text-gray-400 hover:text-gray-600">
            <FaFileAlt size={20} />
          </button>
          <button className="p-3 text-gray-400 hover:text-gray-600">
            <FaUsers size={20} />
          </button>
        </div>
        <button className="p-3 text-gray-400 hover:text-gray-600 mt-auto" onClick={logout}>
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
            <button className="text-gray-500 hover:text-gray-700" onClick={refreshChats}>
              <FaSync />
            </button>
            <button 
              className="text-green-500 hover:text-green-700 font-bold"
              onClick={() => setNewChatModalOpen(true)}
            >
              +
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <FaQuestion />
            </button>
            <div className="flex items-center text-xs text-gray-600">
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
          <button className="px-3 py-1 rounded-md text-xs border border-gray-300 text-gray-600 flex items-center">
            <FaSearch className="mr-1" />
            Search
          </button>
          <button 
            className="px-3 py-1 rounded-md text-xs bg-green-50 text-green-600 border border-green-100 flex items-center"
            onClick={() => setFiltered(!filtered)}
          >
            <span>Filtered</span>
            <FaFilter className="ml-1 text-green-500" />
          </button>
        </div>

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
              <div className="animate-pulse text-gray-400">Loading chats...</div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-400">No chats found</div>
            </div>
          ) : (
            chats.map((chat) => (
              <div 
                key={chat.id}
                className={`flex p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-gray-600 relative mr-3">
                  {(chat.name || 'Unknown').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{chat.name || chat.participants?.[0]?.full_name || 'Unknown Chat'}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {chat.lastMessage ? formatDate(chat.lastMessage.created_at) : formatDate(chat.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.lastMessage ? (
                      <>
                        {chat.lastMessage.sender_id !== user.id && (
                          <span className="font-medium">{chat.lastMessage.sender_name}: </span>
                        )}
                        {chat.lastMessage.content}
                      </>
                    ) : (
                      <span className="italic text-gray-400">No messages yet</span>
                    )}
                  </p>
                  <div className="flex mt-1 items-center">
                    <span className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                      {chat.participants?.filter(p => p.id !== user.id)[0]?.phone || ''}
                    </span>
                    {chat.chat_type && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getBadgeColor(chat.chat_type)}`}>
                        {chat.chat_type.toLowerCase()}
                      </span>
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
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
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
                    <p className="text-xs text-gray-500 flex items-center">
                      {chats.find(c => c.id === selectedChat)?.participants?.filter(p => p.id !== user.id)[0]?.phone || ''}
                                             <span className="mx-1">|</span>
                       {chats.find(c => c.id === selectedChat)?.chat_type?.toLowerCase() || 'unknown'}
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
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <FaPhone size={18} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <FaSearch size={18} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <FaEllipsisV size={18} />
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
                      setLoadingMessages(true);
                      fetch(`/api/messages?chatId=${selectedChat}`)
                        .then(res => res.json())
                        .then(data => {
                          setChatMessages(data.messages || []);
                          setLoadingMessages(false);
                        })
                        .catch(err => {
                          console.error('Error refreshing messages:', err);
                          setLoadingMessages(false);
                        });
                    }
                  }}
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 shadow-md"
                  title="Refresh messages"
                >
                  <FaSync className={loadingMessages ? "animate-spin" : ""} />
                </button>
              </div>
              
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse text-gray-400">Loading messages...</div>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-400">No messages yet</div>
                </div>
              ) : (
                Object.entries(messageGroups).map(([date, messages]) => (
                  <div key={date}>
                    {/* Date marker */}
                    <div className="flex justify-center mb-4">
                      <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                        {date}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    {messages.map((msg, index) => (
                      <div key={msg.id} className={`mb-3 ${msg.isSent ? 'flex justify-end' : 'flex items-start'}`}>
                        {!msg.isSent && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-2">
                            {msg.sender.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-md ${msg.isSent ? '' : 'ml-2'}`}>
                          {/* Show sender info for incoming messages or for the first message in a sequence */}
                          {(!msg.isSent || (index > 0 && messages[index - 1].isSent !== msg.isSent)) && (
                            <div className={`text-xs text-gray-500 mb-1 ${msg.isSent ? 'flex justify-end' : ''}`}>
                              {msg.sender} {msg.phoneNumber && <span className="text-gray-400 ml-1">{msg.phoneNumber}</span>}
                            </div>
                          )}
                          <div className={`${msg.isSent ? 'bg-green-50' : 'bg-white'} p-3 rounded-lg`}>
                            <p className="text-gray-800">{msg.text}</p>
                            <div className={`${msg.isSent ? 'flex justify-between' : ''} items-center mt-1`}>
                              {msg.email && msg.isSent && (
                                <span className="text-xs text-gray-400">{msg.email}</span>
                              )}
                              <div className={`flex items-center ${!msg.isSent ? 'justify-end' : ''}`}>
                                <span className="text-xs text-gray-500 mr-1">{msg.time}</span>
                                {msg.isSent && (
                                  <span className="text-green-500">
                                    <FaCheck className="inline" />
                                    {msg.isRead && <FaCheck className="inline -ml-1" />}
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

            {/* Message tabs */}
            <div className="border-t bg-white flex text-xs">
              <button className="px-4 py-2 text-green-600 border-b-2 border-green-600 font-medium">
                WhatsApp
              </button>
              <button className="px-4 py-2 text-orange-600 flex items-center">
                Private Note
                <span className="ml-1 w-4 h-4 bg-orange-100 rounded-full text-xs flex items-center justify-center text-orange-600">3</span>
              </button>
            </div>

            {/* Message input */}
            <div className="px-3 py-2 border-t bg-white flex items-center">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <FaSmile className="text-xl" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <FaPaperclip className="text-xl" />
              </button>
              <input
                type="text"
                className="flex-1 border-0 bg-gray-100 rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="p-2 text-gray-600 hover:text-gray-900">
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
    </div>
  );
} 