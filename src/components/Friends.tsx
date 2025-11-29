import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useSocket } from "../context/SocketContext";
import FriendContextMenu from "./FriendContextMenu";
import { useUnreadIndicators } from "../hooks/useUnreadIndicators";
import { UnreadBadge } from "./UnreadBadge";
import { useNotification } from "../context/NotificationContext";

interface Props {
  onClose: () => void;
  selectDM?: (user: any) => void;
  setShowSettings: (show: boolean) => void;
  onPendingCountChange?: (count: number) => void;
}

const Friends: React.FC<Props> = ({
  onClose,
  selectDM,
  onPendingCountChange,
}) => {
  const { socket } = useSocket();
  const { showNotification } = useNotification();
  const [tab, setTab] = useState<
    "online" | "all" | "pending" | "sent" | "blocked" | "add"
  >("all");
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { getDMUnreadCount } = useUnreadIndicators(undefined, undefined);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleFriendUpdate = () => {
      loadFriends();
      loadPendingRequests();
      loadSentRequests();
    };

    const handleStatusUpdate = (data: {
      userId: string;
      status: string;
      customStatus?: string;
    }) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend.id === data.userId
            ? {
                ...friend,
                status: data.status,
                customStatus: data.customStatus,
              }
            : friend
        )
      );
    };

    socket.on("friend_request", handleFriendUpdate);
    socket.on("friend_accepted", handleFriendUpdate);
    socket.on("friend_removed", handleFriendUpdate);
    socket.on("user_status", handleStatusUpdate);
    socket.on("friend_request_received", handleFriendUpdate);

    return () => {
      socket.off("friend_request", handleFriendUpdate);
      socket.off("friend_accepted", handleFriendUpdate);
      socket.off("friend_removed", handleFriendUpdate);
      socket.off("user_status", handleStatusUpdate);
      socket.off("friend_request_received", handleFriendUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (tab === "sent") {
      loadSentRequests();
    }
  }, [tab]);

  const loadFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`, {
        withCredentials: true,
      });
      setFriends(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      // Silent fail
      setFriends([]);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/pending`, {
        withCredentials: true,
      });
      const requests = Array.isArray(response.data) ? response.data : [];
      setPendingRequests(requests);
      if (onPendingCountChange) {
        onPendingCountChange(requests.length);
      }
    } catch (error) {
      // Silent fail
      setPendingRequests([]);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/sent`, {
        withCredentials: true,
      });
      setSentRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      // Silent fail
      setSentRequests([]);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    const input = searchInput.trim();
    const isEmail = input.includes("@");

    try {
      await axios.post(
        `${API_URL}/friends/request`,
        isEmail ? { email: input } : { username: input },
        { withCredentials: true }
      );
      setSearchInput("");
      showNotification("Friend request sent!", "success");
      loadPendingRequests();
      loadSentRequests();
    } catch (error: any) {
      showNotification(
        error?.response?.data?.error || "Failed to send friend request",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await axios.post(
        `${API_URL}/friends/accept/${requestId}`,
        {},
        { withCredentials: true }
      );
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      // Silent fail
    }
  };

  const handleMessageClick = (friend: any) => {
    if (selectDM) {
      selectDM(friend);
      onClose();
    }
  };

  // Group friends: online (including idle and dnd), offline
  const onlineFriends = friends.filter(
    (f) =>
      (f.status === "online" || f.status === "idle" || f.status === "dnd") &&
      f.friendStatus !== "blocked"
  );
  const offlineFriends = friends.filter(
    (f) => f.status === "offline" && f.friendStatus !== "blocked"
  );
  const allFriends = friends.filter((f) => f.friendStatus !== "blocked");
  const blockedUsers = friends.filter((f) => f.friendStatus === "blocked");

  const getStatusText = (friend: any) => {
    if (friend.customStatus) return friend.customStatus;
    if (friend.status === "online") return "Online";
    if (friend.status === "idle") return "Idle";
    if (friend.status === "dnd") return "Do Not Disturb";
    return "Offline";
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Friends</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="friends-tabs">
        <button
          className={tab === "online" ? "active" : ""}
          onClick={() => setTab("online")}
        >
          Online
        </button>
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          All
        </button>
        <button
          className={tab === "pending" ? "active" : ""}
          onClick={() => setTab("pending")}
        >
          Pending
        </button>
        <button
          className={tab === "sent" ? "active" : ""}
          onClick={() => setTab("sent")}
        >
          Sent
        </button>
        <button
          className={tab === "blocked" ? "active" : ""}
          onClick={() => setTab("blocked")}
        >
          Blocked
        </button>
        <button
          className={tab === "add" ? "active" : ""}
          onClick={() => setTab("add")}
        >
          Add Friend
        </button>
      </div>

      <div className="friends-content">
        {tab === "online" && (
          <div className="friends-list">
            {onlineFriends.length === 0 ? (
              <p className="empty-message">No friends online</p>
            ) : (
              <>
                {onlineFriends.map((friend) => {
                  const unreadCount = getDMUnreadCount(friend.id);
                  return (
                    <div key={friend.id} className="friend-item-container">
                      <div
                        className={`friend-item ${
                          unreadCount > 0 ? "unread" : ""
                        }`}
                        onClick={() => handleMessageClick(friend)}
                      >
                        <div className="friend-avatar-container">
                          <img
                            src={
                              friend.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                friend.displayName || "User"
                              )}&size=128`
                            }
                            alt="avatar"
                            className="friend-avatar"
                          />
                          <div
                            className={`friend-status-dot status-${
                              friend.status || "offline"
                            }`}
                          />
                        </div>
                        <div className="friend-info">
                          <div className="friend-name">
                            {friend.displayName}
                          </div>
                          <div className="friend-username-status">
                            {friend.username && (
                              <span className="friend-username">
                                @{friend.username}
                              </span>
                            )}
                            {friend.username && (
                              <span className="friend-separator">•</span>
                            )}
                            <span className="friend-status-text">
                              {getStatusText(friend)}
                            </span>
                          </div>
                        </div>
                        {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                      </div>
                      <FriendContextMenu
                        friendId={friend.id}
                        friendName={friend.displayName}
                        onAction={loadFriends}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {tab === "all" && (
          <div className="friends-list">
            {allFriends.length === 0 ? (
              <p className="empty-message">No friends yet</p>
            ) : (
              <>
                {onlineFriends.length > 0 && (
                  <div className="friend-group">
                    <div className="friend-group-header">
                      Online — {onlineFriends.length}
                    </div>
                    {onlineFriends.map((friend) => {
                      const unreadCount = getDMUnreadCount(friend.id);
                      return (
                        <div key={friend.id} className="friend-item-container">
                          <div
                            className={`friend-item ${
                              unreadCount > 0 ? "unread" : ""
                            }`}
                            onClick={() => handleMessageClick(friend)}
                          >
                            <div className="friend-avatar-container">
                              <img
                                src={
                                  friend.avatar ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    friend.displayName || "User"
                                  )}&size=128`
                                }
                                alt="avatar"
                                className="friend-avatar"
                              />
                              <div
                                className={`friend-status-dot status-${
                                  friend.status || "offline"
                                }`}
                              />
                            </div>
                            <div className="friend-info">
                              <div className="friend-name">
                                {friend.displayName}
                              </div>
                              <div className="friend-username-status">
                                {friend.username && (
                                  <span className="friend-username">
                                    @{friend.username}
                                  </span>
                                )}
                                {friend.username && (
                                  <span className="friend-separator">•</span>
                                )}
                                <span className="friend-status-text">
                                  {getStatusText(friend)}
                                </span>
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <UnreadBadge count={unreadCount} />
                            )}
                          </div>
                          <FriendContextMenu
                            friendId={friend.id}
                            friendName={friend.displayName}
                            onAction={loadFriends}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {offlineFriends.length > 0 && (
                  <div className="friend-group">
                    <div className="friend-group-header">
                      Offline — {offlineFriends.length}
                    </div>
                    {offlineFriends.map((friend) => {
                      const unreadCount = getDMUnreadCount(friend.id);
                      return (
                        <div key={friend.id} className="friend-item-container">
                          <div
                            className={`friend-item ${
                              unreadCount > 0 ? "unread" : ""
                            }`}
                            onClick={() => handleMessageClick(friend)}
                          >
                            <div className="friend-avatar-container">
                              <img
                                src={
                                  friend.avatar ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    friend.displayName || "User"
                                  )}&size=128`
                                }
                                alt="avatar"
                                className="friend-avatar"
                              />
                              <div
                                className={`friend-status-dot status-${
                                  friend.status || "offline"
                                }`}
                              />
                            </div>
                            <div className="friend-info">
                              <div className="friend-name">
                                {friend.displayName}
                              </div>
                              <div className="friend-username-status">
                                {friend.username && (
                                  <span className="friend-username">
                                    @{friend.username}
                                  </span>
                                )}
                                {friend.username && (
                                  <span className="friend-separator">•</span>
                                )}
                                <span className="friend-status-text">
                                  {getStatusText(friend)}
                                </span>
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <UnreadBadge count={unreadCount} />
                            )}
                          </div>
                          <FriendContextMenu
                            friendId={friend.id}
                            friendName={friend.displayName}
                            onAction={loadFriends}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "pending" && (
          <div className="friends-list">
            {pendingRequests.length === 0 ? (
              <p className="empty-message">No pending requests</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="friend-item">
                  <div className="friend-avatar-container">
                    <img
                      src={
                        request.user?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          request.user?.displayName || "User"
                        )}&size=128`
                      }
                      alt="avatar"
                      className="friend-avatar"
                    />
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">
                      {request.user?.displayName || "Unknown User"}
                    </div>
                    <div className="friend-username-status">
                      {request.user?.username && (
                        <span className="friend-username">
                          @{request.user.username}
                        </span>
                      )}
                      {request.user?.username && (
                        <span className="friend-separator">•</span>
                      )}
                      <span className="friend-status-text">Pending</span>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptRequest(request.id)}
                    className="friend-action-btn accept"
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "sent" && (
          <div className="friends-list">
            {sentRequests.length === 0 ? (
              <p className="empty-message">No sent requests</p>
            ) : (
              sentRequests.map((request) => (
                <div key={request.id} className="friend-item">
                  <div className="friend-avatar-container">
                    <img
                      src={
                        request.friend?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          request.friend?.displayName || "User"
                        )}&size=128`
                      }
                      alt="avatar"
                      className="friend-avatar"
                    />
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">
                      {request.friend?.displayName || "Unknown User"}
                    </div>
                    <div className="friend-username-status">
                      {request.friend?.username && (
                        <span className="friend-username">
                          @{request.friend.username}
                        </span>
                      )}
                      {request.friend?.username && (
                        <span className="friend-separator">•</span>
                      )}
                      <span className="friend-status-text">Pending</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "blocked" && (
          <div className="friends-list">
            {blockedUsers.length === 0 ? (
              <p className="empty-message">No blocked users</p>
            ) : (
              blockedUsers.map((friend) => (
                <div key={friend.id} className="friend-item-container">
                  <div className="friend-item">
                    <div className="friend-avatar-container">
                      <img
                        src={
                          friend.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            friend.displayName || "User"
                          )}&size=128`
                        }
                        alt="avatar"
                        className="friend-avatar"
                      />
                      <div className="friend-status-dot status-offline" />
                    </div>
                    <div className="friend-info">
                      <div className="friend-name">{friend.displayName}</div>
                      <div className="friend-username-status">
                        {friend.username && (
                          <span className="friend-username">
                            @{friend.username}
                          </span>
                        )}
                        {friend.username && (
                          <span className="friend-separator">•</span>
                        )}
                        <span className="friend-status-text">Blocked</span>
                      </div>
                    </div>
                  </div>
                  <FriendContextMenu
                    friendId={friend.id}
                    friendName={friend.displayName}
                    onAction={loadFriends}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {tab === "add" && (
          <div className="add-friend-section">
            <div className="form-group">
              <label className="ds-form-label">Add Friend</label>
              <p className="help-text">
                You can add friends with their Echo username or email address.
              </p>
              <input
                type="text"
                placeholder="Username or email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendFriendRequest()}
                disabled={loading}
                className="input"
                autoFocus
              />
            </div>
            <div className="add-friend-footer">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={sendFriendRequest}
                disabled={loading || !searchInput.trim()}
                className="btn-primary"
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
