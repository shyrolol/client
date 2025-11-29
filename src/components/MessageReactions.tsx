import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EmojiIcon } from './Icons';
import { API_URL } from '../config';

/* Add to MessageReactions.css */
/*
.emoji-option.selected {
  background-color: var(--bg-medium);
  border-radius: 4px;
}
*/

 

interface Reaction {
  emoji: string;
  count: number;
  users: any[];
  hasReacted: boolean;
}

interface Props {
  messageId: string;
  socket: any;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

const MessageReactions: React.FC<Props> = ({ messageId, socket }) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('reaction_added', (data: any) => {
      if (data.messageId === messageId) {
        loadReactions();
      }
    });

    socket.on('reaction_removed', (data: any) => {
      if (data.messageId === messageId) {
        loadReactions();
      }
    });

    return () => {
      socket.off('reaction_added');
      socket.off('reaction_removed');
    };
  }, [socket, messageId]);

  const loadReactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/${messageId}/reactions`, { withCredentials: true });
      setReactions(res.data);
    } catch (error) {
    }
  };

  const toggleReaction = async (emoji: string, hasReacted: boolean) => {
    try {
      if (hasReacted) {
        await axios.delete(`${API_URL}/messages/${messageId}/reactions`, {
          data: { emoji },
          withCredentials: true
        });
      } else {
        await axios.post(`${API_URL}/messages/${messageId}/reactions`, { emoji }, { withCredentials: true });
      }
    } catch (error) {
    }
  };

  return (
    <div className="message-reactions">
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          className={`reaction-btn ${reaction.hasReacted ? 'reacted' : ''}`}
          onClick={() => toggleReaction(reaction.emoji, reaction.hasReacted)}
          title={reaction.users.map(u => u.displayName).join(', ')}
        >
          <span className="reaction-emoji">{reaction.emoji}</span>
          <span className="reaction-count">{reaction.count}</span>
        </button>
      ))}
      
      <div className="add-reaction-wrapper">
        <button
          className="add-reaction-btn"
          onClick={() => setShowPicker(!showPicker)}
        >
          <EmojiIcon size={16} />
        </button>
        
        {showPicker && (
          <div className="emoji-picker">
            {QUICK_EMOJIS.map(emoji => {
              const existingReaction = reactions.find(r => r.emoji === emoji);
              const hasReacted = existingReaction?.hasReacted || false;
              
              return (
                <button
                  key={emoji}
                  className={`emoji-option ${hasReacted ? 'selected' : ''}`}
                  onClick={() => {
                    toggleReaction(emoji, hasReacted);
                    setShowPicker(false);
                  }}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
