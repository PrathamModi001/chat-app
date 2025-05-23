/**
 * Supabase SQL Schema Definitions
 * 
 * This file contains the SQL statements needed to create all tables in the Periskope database.
 * Run these statements in the Supabase SQL editor to set up your database.
 */

export const createUserTable = `
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR,
  full_name VARCHAR NOT NULL,
  profile_image_url TEXT,
  status VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Set up Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view other users"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
`;

export const createChatsTable = `
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR,
  description TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  chat_type VARCHAR NOT NULL DEFAULT 'direct',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at);

-- Set up Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can view chats"
  ON public.chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Chat admins can update chats"
  ON public.chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = id AND user_id = auth.uid() AND is_admin = true
    )
  );
`;

export const createMessagesTable = `
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type VARCHAR NOT NULL DEFAULT 'text',
  content TEXT,
  is_forwarded BOOLEAN NOT NULL DEFAULT false,
  reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Set up Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to chats they participate in"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );
`;

export const createAttachmentsTable = `
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_type VARCHAR NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR NOT NULL,
  file_size INT4 NOT NULL,
  thumbnail_url TEXT,
  duration INT4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);

-- Set up Row Level Security
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can view attachments"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = attachments.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Message senders can add attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE id = message_id AND sender_id = auth.uid()
    )
  );
`;

export const createMessageStatusTable = `
CREATE TABLE IF NOT EXISTS public.message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'sent',
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON public.message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON public.message_status(user_id);

-- Set up Row Level Security
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view message status for their chats"
  ON public.message_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = message_status.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own message status"
  ON public.message_status FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own message status"
  ON public.message_status FOR INSERT
  WITH CHECK (user_id = auth.uid());
`;

export const createUserActivityTable = `
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_is_online ON public.user_activity(is_online);

-- Set up Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view activity status"
  ON public.user_activity FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (user_id = auth.uid());
`;

export const createChatParticipantsTable = `
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);

-- Set up Row Level Security
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can see who's in their chats"
  ON public.chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Chat admins can add participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid() AND is_admin = true
    )
  );
`;

export const createLabelsTable = `
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#16a34a',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_labels_name ON public.labels(name);

-- Set up Row Level Security
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view labels"
  ON public.labels FOR SELECT
  USING (true);

CREATE POLICY "Users can create labels"
  ON public.labels FOR INSERT
  WITH CHECK (created_by = auth.uid());
`;

export const createChatLabelsTable = `
CREATE TABLE IF NOT EXISTS public.chat_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chat_id, label_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_labels_chat_id ON public.chat_labels(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_labels_label_id ON public.chat_labels(label_id);

-- Set up Row Level Security
ALTER TABLE public.chat_labels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can view chat labels"
  ON public.chat_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_labels.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Chat participants can assign labels"
  ON public.chat_labels FOR INSERT
  WITH CHECK (
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_labels.chat_id AND user_id = auth.uid()
    )
  );
`;

export const createTestTable = `
CREATE TABLE IF NOT EXISTS public.test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Combined SQL to create all tables
export const createAllTables = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

${createUserTable}

${createChatsTable}

${createMessagesTable}

${createAttachmentsTable}

${createMessageStatusTable}

${createUserActivityTable}

${createChatParticipantsTable}

${createLabelsTable}

${createChatLabelsTable}

${createTestTable}
`; 