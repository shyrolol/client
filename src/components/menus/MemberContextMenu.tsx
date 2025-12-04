import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNotification } from "../../context/NotificationContext";
import Modal from "../ui/Modal";
import { Input, Button } from "../ui";
import { API_URL } from "../../config";

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
      showNotification(
        error?.response?.data?.error || "Failed to kick member",
        "error"
      );
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
      showNotification(
        error?.response?.data?.error || "Failed to ban member",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canModerate) return null;

  return (
    <>
      <div
        className="member-context-menu-trigger"
        onClick={() => setShowMenu(!showMenu)}
      >
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
        <Modal
          isOpen={true}
          onClose={() => setShowKickModal(false)}
          title={`Kick ${memberName}`}
          size="sm"
          variant="danger"
        >
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for kicking this member"
            autoFocus
          />
          <div className="form-actions mt-6">
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={() => setShowKickModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleKick}
              variant="primary"
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Kicking..." : "Kick"}
            </Button>
          </div>
        </Modal>
      )}

      {showBanModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowBanModal(false)}
          title={`Ban ${memberName}`}
          size="sm"
          variant="danger"
        >
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for banning this member"
            autoFocus
          />
          <div className="form-actions mt-6">
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={() => setShowBanModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              variant="primary"
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Banning..." : "Ban"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MemberContextMenu;
