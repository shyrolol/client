import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import {
  DeleteIcon,
  ServerIcon,
  CommunityIcon,
  UsersIcon,
  InviteIcon,
} from "./Icons";
import { Input, Textarea, Select, Button } from "./ui";
import { useNotification } from "../context/NotificationContext";

interface Props {
  server: any;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = "overview" | "community" | "members" | "invites" | "bans";

const ServerSettings: React.FC<Props> = ({ server, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showNotification, showConfirm } = useNotification();
  const isOwner = server?.ownerId === user?.id;
  const [tab, setTab] = useState<TabType>(isOwner ? "overview" : "invites");
  const [serverName, setServerName] = useState(server?.name || "");
  const [serverIcon, setServerIcon] = useState(server?.icon || "");
  const [description, setDescription] = useState(server?.description || "");
  const [welcomeMessage, setWelcomeMessage] = useState(
    server?.welcomeMessage || ""
  );
  const [defaultNotifications, setDefaultNotifications] = useState(
    server?.defaultNotifications || 0
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [bans, setBans] = useState<any[]>([]);
  const [loadingBans, setLoadingBans] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (server) {
      setServerName(server.name || "");
      setServerIcon(server.icon || "");
      setDescription(server.description || "");
      setWelcomeMessage(server.welcomeMessage || "");
      setDefaultNotifications(server.defaultNotifications || 0);
    }
  }, [server]);

  useEffect(() => {
    if (tab === "bans" && isOwner && server) {
      loadBans();
    }
  }, [tab, isOwner, server]);

  const loadBans = async () => {
    setLoadingBans(true);
    try {
      const response = await axios.get(`${API_URL}/servers/${server.id}/bans`, {
        withCredentials: true,
      });
      setBans(response.data || []);
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to load bans");
    } finally {
      setLoadingBans(false);
    }
  };

  const handleUnban = async (userId: string) => {
    showConfirm(
      'Unban User',
      'Are you sure you want to unban this user?',
      async () => {
        try {
          await axios.delete(`${API_URL}/servers/${server.id}/bans/${userId}`, {
            withCredentials: true,
          });
          loadBans();
          setMessageType("success");
          setMessage("User unbanned successfully");
          showNotification("User unbanned successfully", "success");
          setTimeout(() => setMessage(""), 3000);
          onSuccess();
        } catch (error: any) {
          setMessageType("error");
          setMessage(error?.response?.data?.error || "Failed to unban user");
          showNotification(error?.response?.data?.error || "Failed to unban user", "error");
          setTimeout(() => setMessage(""), 3000);
        }
      },
      undefined,
      'Unban',
      'Cancel'
    );
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setServerIcon(`${API_URL}${uploadRes.data.url}`);
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to upload icon");
      showNotification("Failed to upload icon", "error");
    }
  };

  const handleUpdateServer = async () => {
    setSaving(true);
    setMessage("");
    try {
      // Build payload only with fields that should be updated
      const payload: any = {};
      const trimmedName = serverName.trim();
      if (trimmedName && trimmedName !== server.name && trimmedName.length > 0) {
        payload.name = trimmedName;
      }
      if (serverIcon !== server.icon) {
        payload.icon = serverIcon || null;
      }
      const trimmedDescription = description.trim();
      if (trimmedDescription !== (server.description || '')) {
        payload.description = trimmedDescription || null;
      }
      const trimmedWelcome = welcomeMessage.trim();
      if (trimmedWelcome !== (server.welcomeMessage || '')) {
        payload.welcomeMessage = trimmedWelcome || null;
      }
      const notificationsValue = Number(defaultNotifications);
      if (!isNaN(notificationsValue) && notificationsValue !== (server.defaultNotifications || 0)) {
        payload.defaultNotifications = Math.max(0, Math.min(1, notificationsValue));
      }

      // Only send request if there are changes
      if (Object.keys(payload).length === 0) {
        setMessageType("success");
        setMessage("No changes to save");
        setTimeout(() => setMessage(""), 3000);
        setSaving(false);
        return;
      }

      const response = await axios.patch(`${API_URL}/servers/${server.id}`, payload, { withCredentials: true });

      if (response.data) {
        setMessageType("success");
        setMessage("Server settings updated successfully!");
        setTimeout(() => {
          setMessage("");
          onSuccess();
        }, 1000);
      }
    } catch (error: any) {
      setMessageType("error");
      setMessage(
        error?.response?.data?.error || "Failed to update server settings"
      );
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServer = async () => {
    showConfirm(
      'Delete Server',
      `Are you sure you want to delete "${server.name}"?\n\nThis action cannot be undone and will delete all channels, messages, and members.`,
      async () => {
        setSaving(true);
        try {
          await axios.delete(`${API_URL}/servers/${server.id}`, {
            withCredentials: true,
          });
          showNotification('Server deleted successfully', 'success');
          onSuccess();
          onClose();
        } catch (error: any) {
          showNotification(error?.response?.data?.error || "Failed to delete server", "error");
        } finally {
          setSaving(false);
        }
      },
      undefined,
      'Delete',
      'Cancel',
      'danger'
    );
  };

  const handleLeaveServer = async () => {
    showConfirm(
      'Leave Server',
      `Are you sure you want to leave "${server.name}"?`,
      async () => {
        setSaving(true);
        try {
          await axios.post(
            `${API_URL}/servers/${server.id}/leave`,
            {},
            { withCredentials: true }
          );
          showNotification('You have left the server', 'success');
          onSuccess();
          onClose();
        } catch (error: any) {
          showNotification(error?.response?.data?.error || "Failed to leave server", "error");
        } finally {
          setSaving(false);
        }
      },
      undefined,
      'Leave',
      'Cancel'
    );
  };

  const generateInvite = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/servers/${server.id}/invite`,
        {},
        { withCredentials: true }
      );
      setInviteCode(res.data.code || "");
      setCopied(false);
      showNotification('Invite code generated', 'success');
    } catch (error: any) {
      showNotification(error?.response?.data?.error || "Failed to generate invite", "error");
    }
  };

  const getTabTitle = () => {
    switch (tab) {
      case "overview":
        return "Server Overview";
      case "community":
        return "Community Settings";
      case "members":
        return "Members";
      case "invites":
        return "Invites";
      case "bans":
        return "Bans";
      default:
        return "";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3>SERVER SETTINGS</h3>
          </div>
          <div className="settings-nav">
            {isOwner && (
              <>
                <div
                  className={`settings-tab ${
                    tab === "overview" ? "active" : ""
                  }`}
                  onClick={() => setTab("overview")}
                >
                  <ServerIcon size={20} /> Overview
                </div>
                <div
                  className={`settings-tab ${
                    tab === "community" ? "active" : ""
                  }`}
                  onClick={() => setTab("community")}
                >
                  <CommunityIcon size={20} /> Community
                </div>
                <div className="settings-divider"></div>
              </>
            )}
            <div
              className={`settings-tab ${tab === "members" ? "active" : ""}`}
              onClick={() => setTab("members")}
            >
              <UsersIcon size={20} /> Members
            </div>
            <div
              className={`settings-tab ${tab === "invites" ? "active" : ""}`}
              onClick={() => setTab("invites")}
            >
              <InviteIcon size={20} /> Invites
            </div>
            {isOwner && (
              <div
                className={`settings-tab ${tab === "bans" ? "active" : ""}`}
                onClick={() => setTab("bans")}
              >
                <UsersIcon size={20} /> Bans
              </div>
            )}

            <div className="settings-divider"></div>
            {isOwner ? (
              <div className="settings-tab danger" onClick={handleDeleteServer}>
                <DeleteIcon size={20} /> Delete Server
              </div>
            ) : (
              <div className="settings-tab danger" onClick={handleLeaveServer}>
                <DeleteIcon size={20} /> Leave Server
              </div>
            )}
          </div>
        </div>

        <div className="settings-content">
          <div className="settings-content-header">
            <h2>{getTabTitle()}</h2>
            <button className="settings-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="settings-content-body">
            {tab === "overview" && isOwner && (
              <div className="settings-section">
                <div
                  className="profile-card"
                  style={{ border: "none", padding: 0, marginBottom: "20px" }}
                >
                  <div
                    className="profile-avatar-wrapper"
                    style={{
                      width: "100px",
                      height: "100px",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      className="avatar-overlay"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>Change</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleIconUpload}
                      style={{ display: "none" }}
                      accept="image/*"
                    />
                    <img
                      src={serverIcon || "https://via.placeholder.com/100"}
                      alt="server icon"
                      className="profile-avatar"
                    />
                  </div>
                </div>
                <Input
                  label="Server Name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Enter server name"
                  maxLength={100}
                />
                <div className="form-group">
                  <label className="ds-form-label">Server ID</label>
                  <input
                    type="text"
                    value={server.id}
                    disabled
                    className="input input-disabled"
                  />
                  <p className="input-hint">Your server's unique identifier</p>
                </div>
                {message && (
                  <div className={`feedback-message ${messageType}`}>
                    {message}
                  </div>
                )}
                <div className="form-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleUpdateServer}
                    disabled={saving || !serverName.trim()}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "community" && isOwner && (
              <div className="settings-section">
                <Textarea
                  label="Server Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your server is about..."
                  rows={4}
                  maxLength={500}
                  hint={`${description.length}/500 characters`}
                />
                <Textarea
                  label="Welcome Message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Message shown to new members when they join..."
                  rows={3}
                  maxLength={250}
                  hint={`${welcomeMessage.length}/250 characters`}
                />
                <Select
                  label="Default Notification Settings"
                  value={defaultNotifications}
                  onChange={(e) =>
                    setDefaultNotifications(parseInt(e.target.value))
                  }
                  options={[
                    { value: 0, label: "All Messages" },
                    { value: 1, label: "Only @mentions" },
                  ]}
                  hint="Default notification level for new members"
                />
                {message && (
                  <div className={`feedback-message ${messageType}`}>
                    {message}
                  </div>
                )}
                <div className="form-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleUpdateServer}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "members" && (
              <div className="settings-section">
                <div className="members-list">
                  {server?.members?.length > 0 ? (
                    server.members.map((member: any) => (
                      <div key={member.id} className="member-item">
                        <img
                          src={
                            member.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${
                              member.user?.displayName || "User"
                            }`
                          }
                          alt={member.user?.displayName || "User"}
                          className="member-avatar"
                        />
                        <div className="member-info">
                          <div className="member-name">
                            {member.user?.displayName || "Unknown User"}
                          </div>
                          <div className="member-role">
                            {member.role || "member"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted padding-xl">No members found</p>
                  )}
                </div>
              </div>
            )}

            {tab === "invites" && (
              <div className="settings-section">
                <div className="form-group">
                  <label className="ds-form-label">Invite Code</label>
                  <div className="invite-code-container">
                    <input
                      type="text"
                      value={inviteCode || ""}
                      readOnly
                      placeholder="Click 'Generate Invite' to create a code"
                      className="input invite-code-input"
                    />
                    {inviteCode && (
                      <Button
                        variant={copied ? "primary" : "secondary"}
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="whitespace-nowrap"
                      >
                        {copied ? "Copied!" : "Copy Code"}
                      </Button>
                    )}
                  </div>
                  <p className="input-hint">
                    Share this code with others to let them join your server
                  </p>
                </div>
                <div className="form-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={generateInvite}
                    disabled={saving}
                  >
                    {inviteCode ? "Generate New Invite" : "Generate Invite"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "bans" && isOwner && (
              <div className="settings-section">
                {message && (
                  <div className={`feedback-message ${messageType}`}>
                    {message}
                  </div>
                )}
                {loadingBans ? (
                  <p className="text-muted padding-xl">Loading bans...</p>
                ) : bans.length === 0 ? (
                  <p className="text-muted padding-xl">No banned users</p>
                ) : (
                  <div className="members-list">
                    {bans.map((ban: any) => (
                      <div key={ban.id} className="member-item">
                        <img
                          src={
                            ban.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${
                              ban.user?.displayName || "User"
                            }`
                          }
                          alt={ban.user?.displayName || "User"}
                          className="member-avatar"
                        />
                        <div className="member-info">
                          <div className="member-name">
                            {ban.user?.displayName || "Unknown User"}
                            {ban.user?.username && (
                              <span className="member-username">
                                @{ban.user.username}
                              </span>
                            )}
                          </div>
                          <div className="member-role">
                            {ban.reason ? `Reason: ${ban.reason}` : "No reason provided"}
                          </div>
                          <div className="member-role" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Banned by {ban.bannedByUser?.displayName || "Unknown"} on{" "}
                            {new Date(ban.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUnban(ban.userId)}
                        >
                          Unban
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerSettings;
