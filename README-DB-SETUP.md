# Setting Up Supabase Database

This guide will help you set up the database tables required for the Periskope application.

## Tables Required

The application requires several tables to function properly:

1. `chats` - Stores chat information
2. `messages` - Stores message content
3. `chat_participants` - Tracks who is in each chat
4. `message_status` - Tracks message read/delivery status
5. `labels` - Stores chat labels
6. `chat_labels` - Tracks which labels are applied to which chats

## Setup Instructions

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create each table using the SQL scripts below
4. Add the necessary Row-Level Security (RLS) policies

## SQL Scripts

### Creating Labels Table

```sql
-- Create labels table
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#16a34a',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat_labels junction table
CREATE TABLE IF NOT EXISTS public.chat_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE NOT NULL,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(chat_id, label_id)
);

-- Create RLS policies for labels
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.labels
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Enable insert access for authenticated users" ON public.labels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for chat_labels
ALTER TABLE public.chat_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for chat participants" ON public.chat_labels
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants
      WHERE chat_id = chat_labels.chat_id
    )
  );
  
CREATE POLICY "Enable insert/delete for chat participants" ON public.chat_labels
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_participants
      WHERE chat_id = chat_labels.chat_id
    )
  );

-- Create index for label search
CREATE INDEX IF NOT EXISTS idx_labels_name ON public.labels (name);

-- Create indexes for chat_labels queries
CREATE INDEX IF NOT EXISTS idx_chat_labels_chat_id ON public.chat_labels (chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_labels_label_id ON public.chat_labels (label_id);
```

## Troubleshooting

If you encounter the error "Unexpected token '<', "<!DOCTYPE "... is not valid JSON", this usually means one of these issues:

1. The API endpoint doesn't exist
2. There's an error in the server-side code
3. The database tables don't exist

Check the following:

1. Make sure all API routes are properly created
2. Ensure that all database tables exist
3. Check browser network tab for more detailed error information

## 404 Errors for Label Endpoints

If you get a 404 error for `/api/chats/[chatId]/labels`, ensure that:

1. The API endpoint file is in the correct location: `/app/api/chats/[chatId]/labels/route.ts`
2. The database tables (`labels` and `chat_labels`) exist
3. Your database has Row-Level Security (RLS) policies configured correctly 