import { useState, useEffect } from 'react';

interface TypingUser {
  userId: string;
  displayName: string;
  channelId: string;
  timestamp: number;
}

export const useTypingIndicators = (socket: any, currentChannel: any) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: { userId: string; displayName: string; channelId: string }) => {
      if (data.channelId !== currentChannel?.id) return;

      const now = Date.now();
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.userId);
        return [...filtered, { ...data, timestamp: now }];
      });

      setTimeout(() => {
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== data.userId || Date.now() - u.timestamp > 3000)
        );
      }, 3000);
    };

    socket.on('user_typing', handleUserTyping);
    return () => {
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, currentChannel]);

  return typingUsers;
};
