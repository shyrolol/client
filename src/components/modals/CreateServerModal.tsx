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
      title={tab === "create" ? "Create Server" : "Join Server"}
      size="md"
      footer={footer}
    >
      <div className="modal-tabs">
        <button
          className={tab === "create" ? "active" : ""}
          onClick={() => setTab("create")}
        >
          Create
        </button>
        <button
          className={tab === "join" ? "active" : ""}
          onClick={() => setTab("join")}
        >
          Join
        </button>
      </div>

      {tab === "create" ? (
        <Input
          label="Server Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Server name"
          autoFocus
        />
      ) : (
        <Input
          label="Invite Code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
          autoFocus
        />
      )}
    </Modal>
  );
};

export default CreateServerModal;
