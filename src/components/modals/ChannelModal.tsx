import React, { useState } from "react";
import axios from "axios";
import { HashIcon, MicIcon, DeleteIcon } from "../ui/Icons";
import { Input, Button } from "../ui";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../config";

interface Props {
  serverId: string;
  channel?: { id: string; name: string; type?: string };
  mode: "create" | "edit";
  onClose: () => void;
  onSuccess: () => void;
}

const ChannelModal: React.FC<Props> = ({
  serverId,
  channel,
  mode,
  onClose,
  onSuccess,
}) => {
  const { showNotification, showConfirm } = useNotification();
  const [name, setName] = useState(channel?.name || "");
  const [type, setType] = useState<"text" | "voice">(
    (channel as any)?.type === "voice" ? "voice" : "text"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const handleSubmit = async () => {
    if (!name.trim()) {
      setMessageType("error");
      setMessage("Channel name is required");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      if (mode === "create") {
        await axios.post(
          `${API_URL}/channels`,
          { serverId, name: name.trim(), type },
          { withCredentials: true }
        );
        setMessageType("success");
        setMessage("Channel created successfully!");
      } else if (channel) {
        await axios.patch(
          `${API_URL}/channels/${channel.id}`,
          { name: name.trim() },
          { withCredentials: true }
        );
        setMessageType("success");
        setMessage("Channel updated successfully!");
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error?.response?.data?.error || "Failed to save channel");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!channel) return;

    showConfirm(
      "Delete Channel",
      `Are you sure you want to delete #${channel.name}? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await axios.delete(`${API_URL}/channels/${channel.id}`, {
            withCredentials: true,
          });
          showNotification("Channel deleted successfully", "success");
          onSuccess();
          onClose();
        } catch (error: any) {
          showNotification(
            error?.response?.data?.error || "Failed to delete channel",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },
      undefined,
      "Delete",
      "Cancel",
      "danger"
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="channel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="channel-modal-header">
          <h2>{mode === "create" ? "Create Channel" : "Edit Channel"}</h2>
          <button className="channel-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="channel-modal-body">
          <Input
            label="Channel Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., general"
            autoFocus
            maxLength={100}
          />

          {mode === "create" && (
            <div className="form-group">
              <label className="ds-form-label">Channel Type</label>
              <div className="channel-type-selector">
                <div
                  className={`channel-type-option ${
                    type === "text" ? "selected" : ""
                  }`}
                  onClick={() => setType("text")}
                >
                  <div className="channel-type-icon">
                    <HashIcon size={20} />
                  </div>
                  <div className="channel-type-info">
                    <div className="channel-type-name">Text Channel</div>
                    <div className="channel-type-desc">
                      Send messages, images, GIFs, and more
                    </div>
                  </div>
                </div>
                <div
                  className={`channel-type-option ${
                    type === "voice" ? "selected" : ""
                  }`}
                  onClick={() => setType("voice")}
                >
                  <div className="channel-type-icon">
                    <MicIcon size={20} />
                  </div>
                  <div className="channel-type-info">
                    <div className="channel-type-name">Voice Channel</div>
                    <div className="channel-type-desc">
                      Hang out together with voice and video
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`feedback-message ${messageType}`}>{message}</div>
          )}
        </div>

        <div className="channel-modal-footer">
          {mode === "edit" && (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              <DeleteIcon size={16} />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading
              ? "Saving..."
              : mode === "create"
              ? "Create Channel"
              : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChannelModal;
