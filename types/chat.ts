export interface User {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  profile_image_url?: string;
}

export interface Label {
  id: string;
  name: string;
  color?: string;
}

export interface Message {
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
  chatId: string; // Added for IndexedDB querying
}

export interface Chat {
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
  participants: User[];
  labels?: Label[];
} 