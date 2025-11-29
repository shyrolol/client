import React, { useState, useRef, useEffect } from 'react';
import { friendsService } from '../services/friendsService';
import { useNotification } from '../context/NotificationContext';

interface FriendMenuProps {
  friendId: string;
  friendName: string;
  onAction: () => void;
}

const FriendContextMenu: React.FC<FriendMenuProps> = ({
  friendId,
  friendName,
  onAction,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showNotification, showConfirm } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleRemove = async () => {
    showConfirm(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      async () => {
        try {
          await friendsService.removeFriend(friendId);
          onAction();
          setShowMenu(false);
          showNotification(`${friendName} has been removed from your friends`, 'success');
        } catch {
          showNotification('Failed to remove friend', 'error');
        }
      },
      undefined,
      'Remove',
      'Cancel'
    );
  };

  const handleBlock = async () => {
    showConfirm(
      'Block User',
      `Are you sure you want to block ${friendName}?`,
      async () => {
        try {
          await friendsService.blockUser(friendId);
          onAction();
          setShowMenu(false);
          showNotification(`${friendName} has been blocked`, 'success');
        } catch {
          showNotification('Failed to block user', 'error');
        }
      },
      undefined,
      'Block',
      'Cancel',
      'danger'
    );
  };

  return (
    <>
      <div className="member-context-menu-trigger" onClick={() => setShowMenu(!showMenu)}>
        <span>⋯</span>
      </div>

      {showMenu && (
        <div className="member-context-menu" ref={menuRef}>
          <button className="context-menu-item" onClick={handleRemove}>
            Remove Friend
          </button>
          <button className="context-menu-item danger" onClick={handleBlock}>
            Block User
          </button>
        </div>
      )}
    </>
  );
};

export default FriendContextMenu;
