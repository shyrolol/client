import React, { useState } from "react";
import axios from "axios";
import { useNotification } from "../../context/NotificationContext";
import Modal from "../ui/Modal";
import { Input, Button } from "../ui";
import { API_URL } from "../../config";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateServerModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"create" | "join">("create");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/servers`,
        { name },
        { withCredentials: true }
      );
      showNotification("Server created successfully", "success");
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification(
        error?.response?.data?.error || "Failed to create server",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

 const handleJoin = async () => {
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/servers/join/${inviteCode}`,
        {},
        { withCredentials: true }
      );
      showNotification("You have joined the server", "success");
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification(
        error?.response?.data?.error || "Failed to join server",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <div className="flex-1" />
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={tab === "create" ? handleCreate : handleJoin}
        variant="primary"
        disabled={
          loading || (tab === "create" ? !name.trim() : !inviteCode.trim())
        }
      >
        {loading
          ? tab === "create"
            ? "Creating..."
            : "Joining..."
          : tab === "create"
          ? "Create"
          : "Join Server"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={tab === "create" ? "Create a Server" : "Join a Server"}
      size="md"
      footer={footer}
    >
      <div className="channel-type-selector">
        <div
          className={`channel-type-option ${tab === "create" ? "selected" : ""}`}
          onClick={() => setTab("create")}
        >
          <div className="channel-type-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div className="channel-type-info">
            <div className="channel-type-name">Create My Own</div>
            <div className="channel-type-desc">Create a new server and invite friends</div>
          </div>
        </div>
        <div
          className={`channel-type-option ${tab === "join" ? "selected" : ""}`}
          onClick={() => setTab("join")}
        >
          <div className="channel-type-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="channel-type-info">
            <div className="channel-type-name">Join a Server</div>
            <div className="channel-type-desc">Enter an invite code to join an existing server</div>
          </div>
        </div>
      </div>

      {tab === "create" ? (
        <Input
          label="Server Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My awesome server"
          autoFocus
        />
      ) : (
        <Input
          label="Invite Code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code (e.g., abc123)"
          autoFocus
        />
      )}
    </Modal>
  );
};

export default CreateServerModal;
