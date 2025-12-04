import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

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

  
  useEffect(() => {
    if (!user) return;

    const loadDMUnreads = async () => {
      try {
        const response = await axios.get(`${API_URL}/dms/conversations`, {
          withCredentials: true,
        });
        const conversations = Array.isArray(response.data) ? response.data : [];

        const newDmUnreads = new Map<string, number>();
        conversations.forEach((conv: any) => {
          if (conv.unreadCount && conv.unreadCount > 0) {
            newDmUnreads.set(conv.id, conv.unreadCount);
          } else {
            
            newDmUnreads.delete(conv.id);
          }
        });

        setDmUnreads(newDmUnreads);
      } catch (error) {
        
      }
    };

    loadDMUnreads();
  }, [user]);

  
  const markChannelAsRead = useCallback(
    (channelId: string) => {
      if (!socket || !user) return;

      
      setChannelUnreads((prev) => {
        const newMap = new Map(prev);
        newMap.delete(channelId);
        return newMap;
      });

      
      socket.emit('mark_read', { channelId });
    },
    [socket, user]
  );

  
  const markDMAsRead = useCallback(
    (dmUserId: string) => {
      if (!socket || !user) return;

      
      setDmUnreads((prev) => {
        const newMap = new Map(prev);
        newMap.delete(dmUserId);
        return newMap;
      });

      
      socket.emit('mark_read', { dmUserId });

      
      setTimeout(async () => {
        try {
          const response = await axios.get(`${API_URL}/dms/conversations`, {
            withCredentials: true,
          });
          const conversations = Array.isArray(response.data) ? response.data : [];

          const newDmUnreads = new Map<string, number>();
          conversations.forEach((conv: any) => {
            if (conv.unreadCount > 0) {
              newDmUnreads.set(conv.id, conv.unreadCount);
            }
          });

          setDmUnreads(newDmUnreads);
        } catch (error) {
          
        }
      }, 500);
    },
    [socket, user]
  );

  
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

  
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      
      if (message.userId === user?.id) return;

      
      if (message.channelId) {
        
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

      
      if (message.dmUserId) {
        
        const dmPartnerId = message.userId;

        
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
