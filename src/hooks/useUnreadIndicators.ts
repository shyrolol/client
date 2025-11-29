import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3001';

interface UnreadIndicatorsHook {
  channelUnreads: Map<string, number>;
  dmUnreads: Map<string, number>;
  markChannelAsRead: (channelId: string) => void;
  markDMAsRead: (userId: string) => void;
  getChannelUnreadCount: (channelId: string) => number;
  getDMUnreadCount: (userId: string) => number;
}

export const useUnreadIndicators = (
  activeChannelId?: string,
  activeDMUserId?: string
): UnreadIndicatorsHook => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [channelUnreads, setChannelUnreads] = useState<Map<string, number>>(
    new Map()
  );
  const [dmUnreads, setDmUnreads] = useState<Map<string, number>>(new Map());

  // Load initial unread counts from server
  useEffect(() => {
    if (!user) return;

    const loadDMUnreads = async () => {
      try {
        const response = await axios.get(`${API_URL}/dms/conversations`, {
          withCredentials: true,
        });
        const conversations = response.data || [];

        const newDmUnreads = new Map<string, number>();
        conversations.forEach((conv: any) => {
          if (conv.unreadCount && conv.unreadCount > 0) {
            newDmUnreads.set(conv.id, conv.unreadCount);
          } else {
            // Ensure we remove entries that are now read
            newDmUnreads.delete(conv.id);
          }
        });

        setDmUnreads(newDmUnreads);
      } catch (error) {
        // Silent fail
      }
    };

    loadDMUnreads();
  }, [user]);

  // Mark channel as read
  const markChannelAsRead = useCallback(
    (channelId: string) => {
      if (!socket || !user) return;

      // Clear local unread count
      setChannelUnreads((prev) => {
        const newMap = new Map(prev);
        newMap.delete(channelId);
        return newMap;
      });

      // Notify server
      socket.emit('mark_read', { channelId });
    },
    [socket, user]
  );

  // Mark DM as read
  const markDMAsRead = useCallback(
    (dmUserId: string) => {
      if (!socket || !user) return;

      // Clear local unread count immediately
      setDmUnreads((prev) => {
        const newMap = new Map(prev);
        newMap.delete(dmUserId);
        return newMap;
      });

      // Notify server
      socket.emit('mark_read', { dmUserId });

      // Reload unread counts from server after a short delay to ensure sync
      setTimeout(async () => {
        try {
          const response = await axios.get(`${API_URL}/dms/conversations`, {
            withCredentials: true,
          });
          const conversations = response.data || [];

          const newDmUnreads = new Map<string, number>();
          conversations.forEach((conv: any) => {
            if (conv.unreadCount > 0) {
              newDmUnreads.set(conv.id, conv.unreadCount);
            }
          });

          setDmUnreads(newDmUnreads);
        } catch (error) {
          // Silent fail
        }
      }, 500);
    },
    [socket, user]
  );

  // Auto-mark active channel/DM as read
  useEffect(() => {
    if (activeChannelId) {
      markChannelAsRead(activeChannelId);
    }
  }, [activeChannelId, markChannelAsRead]);

  useEffect(() => {
    if (activeDMUserId) {
      markDMAsRead(activeDMUserId);
    }
  }, [activeDMUserId, markDMAsRead]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Don't increment if message is from current user
      if (message.userId === user?.id) return;

      // Channel message
      if (message.channelId) {
        // Don't increment if user is viewing this channel
        if (message.channelId === activeChannelId) {
          markChannelAsRead(message.channelId);
          return;
        }

        setChannelUnreads((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(message.channelId) || 0;
          newMap.set(message.channelId, current + 1);
          return newMap;
        });
      }

      // DM message
      if (message.dmUserId) {
        // Sender is the DM partner
        const dmPartnerId = message.userId;

        // Don't increment if user is viewing this DM
        if (dmPartnerId === activeDMUserId) {
          markDMAsRead(dmPartnerId);
          return;
        }

        setDmUnreads((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(dmPartnerId) || 0;
          newMap.set(dmPartnerId, current + 1);
          return newMap;
        });
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user, activeChannelId, activeDMUserId, markChannelAsRead, markDMAsRead]);

  const getChannelUnreadCount = useCallback(
    (channelId: string) => channelUnreads.get(channelId) || 0,
    [channelUnreads]
  );

  const getDMUnreadCount = useCallback(
    (userId: string) => dmUnreads.get(userId) || 0,
    [dmUnreads]
  );

  return {
    channelUnreads,
    dmUnreads,
    markChannelAsRead,
    markDMAsRead,
    getChannelUnreadCount,
    getDMUnreadCount,
  };
};
