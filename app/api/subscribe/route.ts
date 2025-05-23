import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Create Supabase client with server-side options - configured only on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This entire function runs only on the server
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  
  // Create a unique session ID for this connection to avoid channel name conflicts
  const sessionId = randomUUID();
  
  // Create a fresh Supabase client for each connection - SERVER SIDE ONLY
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    // Safe to use realtime on the server
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  // Set headers for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let channels: any[] = [];
      let connected = true;
      let pingInterval: ReturnType<typeof setInterval> | undefined;
      
      // Helper function to safely send data
      const safeSend = (data: string) => {
        if (connected) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('Failed to send data:', error);
            // If we can't send data, consider the connection lost
            connected = false;
          }
        }
      };
      
      try {
        // Send initial connection established message
        safeSend(`event: connected\ndata: {"sessionId":"${sessionId}"}\n\n`);
        
        // Set up chat changes subscription
        const chatChannelName = `chats-channel-${sessionId}`;
        const chatChannel = supabase
          .channel(chatChannelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'chats'
          }, (payload) => {
            if (connected) {
              safeSend(`event: chat_update\ndata: ${JSON.stringify(payload)}\n\n`);
            }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          }, (payload) => {
            if (connected) {
              safeSend(`event: message_affects_chat\ndata: ${JSON.stringify(payload)}\n\n`);
            }
          });
        
        channels.push(chatChannel);
        
        // Subscribe to the channel and report status
        chatChannel
          .subscribe((status) => {
            console.log(`Chat channel ${chatChannelName} status:`, status);
            if (connected) {
              safeSend(`event: subscription_status\ndata: ${JSON.stringify({ channel: 'chats', status })}\n\n`);
            }
          });
        
        // If a specific chat is provided, subscribe to its messages
        if (chatId) {
          const messageChannelName = `messages-channel-${sessionId}-${chatId}`;
          const messageChannel = supabase
            .channel(messageChannelName)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatId}`
            }, (payload) => {
              if (connected) {
                safeSend(`event: new_message\ndata: ${JSON.stringify(payload)}\n\n`);
              }
            });
          
          channels.push(messageChannel);
          
          // Subscribe to the message channel and report status
          messageChannel
            .subscribe((status) => {
              console.log(`Message channel ${messageChannelName} status:`, status);
              if (connected) {
                safeSend(`event: subscription_status\ndata: ${JSON.stringify({ channel: 'messages', status })}\n\n`);
              }
            });
        }
        
        // Add a subscription for read receipts
        if (chatId) {
          const readStatusChannel = supabase
            .channel(`read-status-channel-${sessionId}-${chatId}`)
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatId}`,
            }, (payload) => {
              if (connected && payload.new && payload.old) {
                // Only send if read_at changed from null to a value
                if (!payload.old.read_at && payload.new.read_at) {
                  safeSend(`event: message_read\ndata: ${JSON.stringify(payload)}\n\n`);
                }
              }
            })
            .subscribe((status) => {
              console.log(`Read status channel ${chatId} status:`, status);
              if (connected) {
                safeSend(`event: subscription_status\ndata: ${JSON.stringify({ channel: 'read-status', status })}\n\n`);
              }
            });
          
          channels.push(readStatusChannel);
        }
        
        // Keep the connection alive with a ping every 15 seconds
        pingInterval = setInterval(() => {
          if (connected) {
            safeSend('event: ping\ndata: {}\n\n');
          } else if (pingInterval) {
            clearInterval(pingInterval);
          }
        }, 15000);
        
        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`Client disconnected: ${sessionId}`);
          connected = false;
          
          // Clean up resources
          if (pingInterval) {
            clearInterval(pingInterval);
          }
          
          // Remove all channels
          for (const channel of channels) {
            supabase.removeChannel(channel).catch(err => {
              console.error('Error removing channel:', err);
            });
          }
        });
      } catch (error) {
        console.error('Error setting up SSE connection:', error);
        controller.close();
      }
    }
  });
  
  // Return the stream as SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
} 