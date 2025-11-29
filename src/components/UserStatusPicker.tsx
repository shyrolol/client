import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

interface Props {
  onClose: () => void;
  position?: { top?: number; left?: number; bottom?: number; right?: number };
}

const API_URL = "http://localhost:3001";

const UserStatusPicker: React.FC<Props> = ({ onClose, position }) => {
  const { user, setUser } = useAuth();
  const { showNotification } = useNotification();
  const [customText, setCustomText] = useState(user?.customStatus || "");

  const handleStatusChange = async (status: string) => {
    try {
      if (!user) return;

      // API call first
      const response = await axios.patch(
        `${API_URL}/users/status`,
        { status, customStatus: customText || null },
        { withCredentials: true }
      );

      // Update local state after successful API call
      const updatedUser = { ...user, status: response.data.status, customStatus: response.data.customStatus };
      setUser(updatedUser);
      localStorage.setItem("userStatus", status);

      onClose();
    } catch (error: any) {
      console.error("Failed to update status", error);
      showNotification(error?.response?.data?.error || "Failed to update status", "error");
    }
  };

  const handleCustomStatusSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      try {
        if (!user) return;

        const response = await axios.patch(
          `${API_URL}/users/status`,
          { status: user.status, customStatus: customText || null },
          { withCredentials: true }
        );

        const updatedUser = { ...user, customStatus: response.data.customStatus };
        setUser(updatedUser);

        onClose();
      } catch (error: any) {
        showNotification(error?.response?.data?.error || "Failed to update status", "error");
      }
    }
  };

  return (
    <>
      <div className="user-status-picker-overlay" onClick={onClose}></div>
      <div className="user-status-picker" style={position} onClick={(e) => e.stopPropagation()}>
        <div
          className="status-option"
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange("online");
          }}
        >
          <div className="status-indicator status-online"></div>
          <span>Online</span>
        </div>
        <div
          className="status-option"
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange("idle");
          }}
        >
          <div className="status-indicator status-idle"></div>
          <span>Idle</span>
        </div>
        <div
          className="status-option"
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange("dnd");
          }}
        >
          <div className="status-indicator status-dnd"></div>
          <span>Do Not Disturb</span>
        </div>
        <div
          className="status-option"
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange("offline");
          }}
        >
          <div className="status-indicator status-offline"></div>
          <span>Invisible</span>
        </div>

        <div className="custom-status-input" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            placeholder="Set a custom status..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={handleCustomStatusSubmit}
            autoFocus
          />
        </div>
      </div>
    </>
  );
};

export default UserStatusPicker;
