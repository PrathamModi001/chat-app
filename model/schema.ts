// Periskope schema

// Users table
export type User = {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  profile_image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

// Messages table
export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  message_type: string;
  content: string;
  is_forwarded: boolean;
  reply_to_message_id?: string;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
};

// Chats table
export type Chat = {
  id: string;
  name?: string;
  description?: string;
  is_group: boolean;
  chat_type: string;
  created_at: string;
  updated_at: string;
};

// Attachments table
export type Attachment = {
  id: string;
  message_id: string;
  file_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
};

// Message status table
export type MessageStatus = {
  id: string;
  message_id: string;
  user_id: string;
  status: string;
  delivered_at?: string;
  read_at?: string;
};

// User activity table
export type UserActivity = {
  id: string;
  user_id: string;
  last_active_at: string;
  is_online: boolean;
};

// Chat participants table
export type ChatParticipant = {
  id: string;
  chat_id: string;
  user_id: string;
  is_admin: boolean;
  joined_at: string;
};

// Labels table
export type Label = {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
};

// Chat labels table (junction table between chats and labels)
export type ChatLabel = {
  id: string;
  chat_id: string;
  label_id: string;
  assigned_by: string;
  assigned_at: string;
};

// Chat label assignments table (same as chat_labels but with different naming)
export type ChatLabelAssignment = {
  chat_id: string;
  label_id: string;
  assigned_by: string;
  assigned_at: string;
};

// Test table
export type Test = {
  id: string;
  name: string;
  created_at: string;
}; 