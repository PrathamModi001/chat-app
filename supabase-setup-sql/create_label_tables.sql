-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.chat_label_assignments CASCADE;
DROP TABLE IF EXISTS public.labels CASCADE;

-- Create labels table
CREATE TABLE public.labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#16a34a',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat_label_assignments junction table
CREATE TABLE public.chat_label_assignments (
  chat_id UUID NOT NULL,
  label_id UUID NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (chat_id, label_id),
  FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES public.labels(id) ON DELETE CASCADE
);

-- Create index for label search
CREATE INDEX idx_labels_name ON public.labels (name);

-- Create indexes for chat_label_assignments queries
CREATE INDEX idx_chat_label_assignments_chat_id ON public.chat_label_assignments (chat_id);
CREATE INDEX idx_chat_label_assignments_label_id ON public.chat_label_assignments (label_id); 