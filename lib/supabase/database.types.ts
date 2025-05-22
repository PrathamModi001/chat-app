export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string
          profile_image_url?: string
          status?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone: string
          profile_image_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string
          profile_image_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          name?: string
          description?: string
          is_group: boolean
          chat_type: 'Demo' | 'Internal' | 'Signup' | 'Content' | 'Dont Send'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          description?: string
          is_group?: boolean
          chat_type?: 'Demo' | 'Internal' | 'Signup' | 'Content' | 'Dont Send'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_group?: boolean
          chat_type?: 'Demo' | 'Internal' | 'Signup' | 'Content' | 'Dont Send'
          created_at?: string
          updated_at?: string
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          is_admin: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          is_admin?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          is_admin?: boolean
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location'
          content: string
          is_forwarded: boolean
          reply_to_message_id?: string
          created_at: string
          delivered_at?: string
          read_at?: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location'
          content: string
          is_forwarded?: boolean
          reply_to_message_id?: string
          created_at?: string
          delivered_at?: string
          read_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location'
          content?: string
          is_forwarded?: boolean
          reply_to_message_id?: string
          created_at?: string
          delivered_at?: string
          read_at?: string
        }
      }
      message_status: {
        Row: {
          id: string
          message_id: string
          user_id: string
          status: 'pending' | 'delivered' | 'read'
          delivered_at?: string
          read_at?: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          status?: 'pending' | 'delivered' | 'read'
          delivered_at?: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          status?: 'pending' | 'delivered' | 'read'
          delivered_at?: string
          read_at?: string
        }
      }
      chat_labels: {
        Row: {
          id: string
          name: string
          color?: string
          created_by?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_by?: string
          created_at?: string
        }
      }
      chat_label_assignments: {
        Row: {
          chat_id: string
          label_id: string
          assigned_by?: string
          assigned_at: string
        }
        Insert: {
          chat_id: string
          label_id: string
          assigned_by?: string
          assigned_at?: string
        }
        Update: {
          chat_id?: string
          label_id?: string
          assigned_by?: string
          assigned_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          message_id: string
          file_type: string
          file_url: string
          file_name?: string
          file_size?: number
          thumbnail_url?: string
          duration?: number
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_type: string
          file_url: string
          file_name?: string
          file_size?: number
          thumbnail_url?: string
          duration?: number
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_type?: string
          file_url?: string
          file_name?: string
          file_size?: number
          thumbnail_url?: string
          duration?: number
          created_at?: string
        }
      }
      user_activity: {
        Row: {
          user_id: string
          last_active_at: string
          is_online: boolean
        }
        Insert: {
          user_id: string
          last_active_at?: string
          is_online?: boolean
        }
        Update: {
          user_id?: string
          last_active_at?: string
          is_online?: boolean
        }
      }
    }
  }
} 