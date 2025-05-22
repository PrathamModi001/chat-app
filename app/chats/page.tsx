'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  FaUser, FaSearch, FaEllipsisV, FaPaperPlane, FaSmile, 
  FaPaperclip, FaMicrophone, FaHome, FaComments, FaChartLine,
  FaFileAlt, FaCog, FaUsers, FaFilter, FaSave, FaSync, FaPhone,
  FaQuestion, FaCheck
} from 'react-icons/fa';

interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessagePrefix?: string;
  date: string;
  unread?: number;
  status?: 'online' | 'offline';
  type?: 'demo' | 'internal' | 'content' | 'signup' | 'standard';
  phoneNumber?: string;
  isForwarded?: boolean;
  avatar?: string;
}

export default function ChatsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filtered, setFiltered] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Sample chat data mimicking the screenshot
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Test El Centro',
      lastMessage: 'Hello, Livonia!',
      date: '23-01-2025',
      type: 'demo',
      phoneNumber: '+91 99713 44098'
    },
    {
      id: '2',
      name: 'Test Skope Final 5',
      lastMessagePrefix: 'Support2:',
      lastMessage: "This doesn't go on Tuesday...",
      date: 'Yesterday',
      type: 'demo',
      phoneNumber: '+91 99713 44098'
    },
    {
      id: '3',
      name: 'Periskope Team Chat',
      lastMessagePrefix: 'Periskope:',
      lastMessage: 'Test message',
      date: '28-Feb-25',
      unread: 1,
      type: 'internal',
      phoneNumber: '+91 99713 44098'
    },
    {
      id: '4',
      name: '+91 99999 99999',
      lastMessagePrefix: '',
      lastMessage: "Hi there, I'm Swapnika, Co-Founder of...",
      date: '25-Feb-25',
      type: 'signup',
      phoneNumber: '+91 92899 99999'
    },
    {
      id: '5',
      name: 'Test Demo17',
      lastMessagePrefix: 'Rohosen:',
      lastMessage: '123',
      date: '25-Feb-25',
      type: 'content',
      phoneNumber: '+91 99713 44098'
    },
    {
      id: '6',
      name: 'Testing group',
      lastMessagePrefix: '',
      lastMessage: 'Testing 12345',
      date: '27-Jan-25',
      type: 'demo',
      phoneNumber: '+91 92899 99999'
    },
    {
      id: '7',
      name: 'Yasin 3',
      lastMessagePrefix: '',
      lastMessage: 'First Bulk Message',
      date: '25-Nov-24',
      type: 'demo',
      phoneNumber: '+91 99713 44098'
    }
  ];

  // Sample messages for selected chat
  const chatMessages = [
    {
      id: '1',
      text: 'Hello, South Euna!',
      time: '08:01',
      sender: 'Roshniag Airtel',
      phoneNumber: '+91 63846 47925',
      isSent: false,
      date: '23-01-2025',
      position: 'top',
      isDelivered: false,
      isRead: false
    },
    {
      id: '2',
      text: 'CDERT',
      time: '11:54',
      sender: 'CDERT',
      isSent: false,
      position: 'middle',
      isDelivered: false,
      isRead: false
    },
    {
      id: '3',
      text: 'CYFER',
      time: '11:51',
      sender: 'CYFER',
      isSent: false,
      position: 'bottom',
      isDelivered: false,
      isRead: false
    },
    {
      id: '4',
      text: 'hello',
      time: '12:07',
      sender: 'Periskope',
      phoneNumber: '+91 99713 44098',
      isSent: true,
      position: 'single',
      isDelivered: true,
      isRead: true
    },
    {
      id: '5',
      text: 'test el centro',
      time: '09:49',
      sender: 'Periskope',
      phoneNumber: '+91 99713 44098',
      isSent: true,
      position: 'single',
      isDelivered: true,
      isRead: true,
      email: 'chang@neimoidia.dev',
      date: '23-01-2025'
    },
    {
      id: '6',
      text: 'testing',
      time: '09:49',
      sender: 'Periskope',
      phoneNumber: '+91 99713 44098',
      isSent: true,
      position: 'single',
      isDelivered: true,
      isRead: true,
      email: 'chang@neimoidia.dev',
      date: '23-01-2025'
    }
  ];

  useEffect(() => {
    // If user is not authenticated and not loading, redirect to login
    if (!user && !loading) {
      router.push('/login');
    }

    // Set the first chat as selected by default for demo
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0].id);
    }
  }, [user, loading, router, chats, selectedChat]);

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
      case 'demo': return 'bg-gray-100 text-gray-700';
      case 'internal': return 'bg-green-50 text-green-600';
      case 'content': return 'bg-blue-50 text-blue-600';
      case 'signup': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-screen">
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
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
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
        <button className="p-3 text-gray-400 hover:text-gray-600 mt-auto">
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
            <button className="text-gray-500 hover:text-gray-700">
              <FaSync />
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
        <div className="flex-1 overflow-y-auto bg-white">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              className={`flex p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-gray-100' : ''}`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-gray-600 relative mr-3">
                {chat.name.charAt(0).toUpperCase()}
                {chat.status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{chat.date}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {chat.lastMessagePrefix && <span className="font-medium">{chat.lastMessagePrefix} </span>}
                  {chat.lastMessage}
                </p>
                <div className="flex mt-1 items-center">
                  <span className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                    {chat.phoneNumber}
                  </span>
                  {chat.type && (
                    <span className={`text-xs px-2 py-0.5 rounded ${getBadgeColor(chat.type)}`}>
                      {chat.type}
                    </span>
                  )}
                  {chat.unread && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      +{chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {selectedChat ? (
          <>
            <div className="p-3 border-b flex justify-between items-center bg-white">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                  {chats.find(c => c.id === selectedChat)?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-medium text-sm">{chats.find(c => c.id === selectedChat)?.name}</h2>
                  <p className="text-xs text-gray-500 flex items-center">
                    {chats.find(c => c.id === selectedChat)?.phoneNumber}
                    <span className="mx-1">|</span>
                    {chats.find(c => c.id === selectedChat)?.type}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="flex -space-x-2">
                  {/* Profile pictures of participants */}
                  <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-gray-500 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">+3</div>
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
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {/* Date marker */}
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  22-01-2025
                </span>
              </div>

              {/* Incoming message */}
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  R
                </div>
                <div className="ml-2 max-w-md">
                  <div className="text-xs text-gray-500 mb-1">Roshniag Airtel <span className="text-gray-400">+91 63846 47925</span></div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-800">Hello, South Euna!</p>
                    <div className="text-xs text-gray-500 text-right mt-1">08:01</div>
                  </div>
                </div>
              </div>

              {/* Date marker */}
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  23-01-2025
                </span>
              </div>

              {/* Incoming message */}
              <div className="mb-3">
                <div className="ml-10 max-w-md">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-800">CDERT</p>
                    <div className="text-xs text-gray-500 text-right mt-1">09:49</div>
                  </div>
                </div>
              </div>

              {/* Outgoing message */}
              <div className="flex justify-end mb-3">
                <div className="max-w-md">
                  <div className="flex justify-end">
                    <div className="text-xs text-gray-500 mb-1">Periskope <span className="text-gray-400">+91 99713 44098</span></div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-800">hello</p>
                    <div className="flex justify-end items-center mt-1">
                      <span className="text-xs text-gray-500 mr-1">12:07</span>
                      <span className="text-green-500">
                        <FaCheck className="inline" />
                        <FaCheck className="inline -ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Another outgoing message */}
              <div className="flex justify-end mb-3">
                <div className="max-w-md">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-800">test el centro</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">chang@neimoidia.dev</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">09:49</span>
                        <span className="text-green-500">
                          <FaCheck className="inline" />
                          <FaCheck className="inline -ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Another outgoing message */}
              <div className="flex justify-end mb-3">
                <div className="max-w-md">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-800">testing</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">chang@neimoidia.dev</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">09:49</span>
                        <span className="text-green-500">
                          <FaCheck className="inline" />
                          <FaCheck className="inline -ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              />
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <FaMicrophone className="text-xl" />
              </button>
              <button className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700">
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