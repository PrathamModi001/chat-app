'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatId as string;

  useEffect(() => {
    if (!user) return;
    
    // Instead of rendering a new UI, redirect back to the main chats page
    // The main chats page will handle selecting the correct chat
    router.replace(`/chats?chatId=${chatId}`);
  }, [chatId, router, user]);

  // Show nothing while redirecting
  return null;
} 