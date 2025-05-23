'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaUsers, FaPaperPlane, FaEllipsisV, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '@/lib/context/AuthContext';
import { Message, User, Chat } from '@/types/chat';

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [groupInfo, setGroupInfo] = useState<{
    chat: Chat;
    participants: User[];
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const groupId = params.groupId as string;

  // Fetch group info
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${groupId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/chats');
            return;
          }
          throw new Error('Failed to fetch group information');
        }
        
        const data = await response.json();
        setGroupInfo(data);
        
        // Fetch messages after getting group info
        fetchMessages();
      } catch (error) {
        console.error('Error fetching group info:', error);
        setError('Failed to load group. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (groupId && user) {
      fetchGroupInfo();
    }
  }, [groupId, user, router]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${groupId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Scroll to bottom when messages load
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      setSending(true);
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: groupId,
          content: newMessage.trim(),
          messageType: 'text',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Clear the input
      setNewMessage('');
      
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format date for display
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped: { [date: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.time).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return Object.entries(grouped).map(([date, messages]) => ({
      date,
      messages,
    }));
  };

  // Find participant by ID
  const findParticipant = (userId: string): User | undefined => {
    return groupInfo?.participants.find(p => p.id === userId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/chats')}
              className="mr-3 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft />
            </button>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                <FaUsers />
              </div>
              <div>
                <h1 className="font-medium text-lg">
                  {loading ? 'Loading...' : groupInfo?.chat.name || 'Group Chat'}
                </h1>
                <p className="text-sm text-gray-500">
                  {groupInfo?.participants.length || 0} members
                </p>
              </div>
            </div>
          </div>
          
          <button className="text-gray-600 hover:text-gray-800">
            <FaEllipsisV />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-3 text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">No messages yet. Be the first to send a message!</div>
        ) : (
          <div className="space-y-6">
            {groupMessagesByDate().map(({ date, messages }) => (
              <div key={date} className="space-y-3">
                <div className="text-center">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-600">
                    {formatMessageDate(date)}
                  </span>
                </div>
                
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  const sender = findParticipant(message.sender_id);
                  
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex max-w-[75%]">
                        {!isCurrentUser && (
                          <div className="flex-shrink-0 mr-2 self-end mb-1">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                              {sender?.profile_image_url ? (
                                <img 
                                  src={sender.profile_image_url} 
                                  alt={sender.full_name} 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                sender?.full_name.charAt(0).toUpperCase()
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          {!isCurrentUser && (
                            <div className="text-xs text-gray-500 mb-1 ml-1">
                              {sender?.full_name}
                            </div>
                          )}
                          
                          <div className={`rounded-lg px-4 py-2 ${
                            isCurrentUser 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white text-gray-800 border'
                          }`}>
                            <div className="whitespace-pre-wrap break-words">
                              {message.text}
                            </div>
                            <div className={`text-xs mt-1 text-right ${
                              isCurrentUser ? 'text-green-100' : 'text-gray-400'
                            }`}>
                              {formatMessageTime(message.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="bg-white border-t p-3">
        <div className="max-w-5xl mx-auto flex items-center">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`ml-3 w-10 h-10 rounded-full flex items-center justify-center ${
              !newMessage.trim() || sending
                ? 'bg-gray-200 text-gray-400'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
      </div>
    </div>
  );
} 