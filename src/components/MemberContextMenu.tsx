import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNotification } from "../context/NotificationContext";
import { API_URL } from "../config";

interface MemberContextMenuProps {
  memberId: string;
  memberName: string;
  isOwner: boolean;
  currentUserId?: string;
  serverId: string;
  onAction: () => void;
}

const MemberContextMenu: React.FC<MemberContextMenuProps> = ({
  memberId,
  memberName,
  isOwner,
  currentUserId,
  serverId,
  onAction,
}) => {
  const { showNotification } = useNotification();
  const [showMenu, setShowMenu] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const canModerate = isOwner && memberId !== currentUserId;

  const handleKick = async () => {
    if (!reason.trim()) {
      showNotification("Please provide a reason", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/servers/${serverId}/members/${memberId}/kick`,
        { reason: reason.trim() },
        { withCredentials: true }
      );
      setShowKickModal(false);
      setReason("");
      showNotification(`${memberName} has been kicked`, "success");
      onAction();
    } catch (error: any) {
      showNotification(error?.response?.data?.error || "Failed to kick member", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!reason.trim()) {
      showNotification("Please provide a reason", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/servers/${serverId}/members/${memberId}/ban`,
        { reason: reason.trim() },
        { withCredentials: true }
      );
      setShowBanModal(false);
      setReason("");
      showNotification(`${memberName} has been banned`, "success");
      onAction();
    } catch (error: any) {
      showNotification(error?.response?.data?.error || "Failed to ban member", "error");
    } finally {
      setLoading(false);
    }
  };


  if (!canModerate) return null;

  return (
    <>
      <div className="member-context-menu-trigger" onClick={() => setShowMenu(!showMenu)}>
        <span>⋯</span>
      </div>

      {showMenu && (
        <div className="member-context-menu" ref={menuRef}>
          <button
            className="context-menu-item danger"
            onClick={() => {
              setShowKickModal(true);
              setShowMenu(false);
            }}
          >
            Kick {memberName}
          </button>
          <button
            className="context-menu-item danger"
            onClick={() => {
              setShowBanModal(true);
              setShowMenu(false);
            }}
          >
            Ban {memberName}
          </button>
        </div>
      )}

      {showKickModal && (
        <div className="modal-overlay" onClick={() => setShowKickModal(false)}>
          <div className="channel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="channel-modal-header">
              <h2>Kick {memberName}</h2>
              <button className="channel-modal-close" onClick={() => setShowKickModal(false)}>
                ×
              </button>
            </div>
            <div className="channel-modal-body">
              <div className="form-group">
                <label className="ds-form-label">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for kicking this member"
                  className="input"
                  autoFocus
                />
              </div>
            </div>
            <div className="channel-modal-footer">
              <div className="flex-1" />
              <button onClick={() => setShowKickModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleKick} className="btn-primary danger" disabled={loading}>
                {loading ? "Kicking..." : "Kick"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="channel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="channel-modal-header">
              <h2>Ban {memberName}</h2>
              <button className="channel-modal-close" onClick={() => setShowBanModal(false)}>
                ×
              </button>
            </div>
            <div className="channel-modal-body">
              <div className="form-group">
                <label className="ds-form-label">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for banning this member"
                  className="input"
                  autoFocus
                />
              </div>
            </div>
            <div className="channel-modal-footer">
              <div className="flex-1" />
              <button onClick={() => setShowBanModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleBan} className="btn-primary danger" disabled={loading}>
                {loading ? "Banning..." : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default MemberContextMenu;

