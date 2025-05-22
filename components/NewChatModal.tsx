import { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';

interface User {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  profile_image_url?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/users${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce the search
    const debounceTimer = setTimeout(() => {
      fetchUsers(value);
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  };

  const createChat = async (userId: string) => {
    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch('/api/chats/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          chatType: 'Demo',
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create chat');
      }
      
      const data = await response.json();
      
      // Call the callback with the new chat ID
      onChatCreated(data.chat.id);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">New Chat</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Search input */}
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <FaSpinner className="animate-spin text-green-500 text-2xl" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No users found matching your search' : 'No users available'}
            </div>
          ) : (
            <ul>
              {users.map(user => (
                <li 
                  key={user.id}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => createChat(user.id)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-gray-600 mr-3">
                      {user.profile_image_url ? (
                        <img 
                          src={user.profile_image_url} 
                          alt={user.full_name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-500">{user.phone || user.email || ''}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {creating && (
          <div className="p-4 border-t bg-gray-50 flex justify-center">
            <div className="flex items-center">
              <FaSpinner className="animate-spin text-green-500 mr-2" />
              <span>Creating chat...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 