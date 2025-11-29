import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import CreateServerModal from "../components/CreateServerModal";
import ChannelModal from "../components/ChannelModal";
import Settings from "../components/Settings";
import ServerSettings from "../components/ServerSettings";
import Friends from "../components/Friends";
import UserStatusPicker from "../components/UserStatusPicker";
import BetaExpiryNotice from "../components/BetaExpiryNotice";
import VoiceStage from "../components/Voice/VoiceStage";
import MemberList from "../components/MemberList";
import { useVoice } from "../hooks/useVoice";
import { useNotification } from "../context/NotificationContext";
import {
  UsersIcon,
  SettingsIcon,
  AddIcon,
  HashIcon,
  EditIcon,
  ReplyIcon,
  DeleteIcon,
  VolumeUpIcon,
  LogoutIcon,
  UploadIcon,
} from "../components/Icons";

const API_URL = "http://localhost:3001";

interface Server {
  id: string;
  name: string;
  icon?: string;
  avatar?: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  serverId?: string;
  position?: number;
}

interface Message {
  id: string;
  content: string;
  channelId?: string;
  dmUserId?: string;
  user: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      displayName: string;
    };
  };
  attachments?: Array<{
    url: string;
    filename: string;
    mimetype: string;
  }>;
}

const Home: React.FC = () => {
  const { user, loading, setUser } = useAuth();
  const { socket } = useSocket();
  const { showNotification, showConfirm } = useNotification();
  const navigate = useNavigate();

  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<any>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentDM, setCurrentDM] = useState<any>(null);
  const [dmConversations, setDmConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelModalMode, setChannelModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showMobileChannelDropdown, setShowMobileChannelDropdown] = useState(false);
  const [unreadChannels, setUnreadChannels] = useState<Set<string>>(new Set());
  const [unreadDMs, setUnreadDMs] = useState<Set<string>>(new Set());
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
  const [viewMode, setViewMode] = useState<"server" | "dm">("server");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; filename: string; mimetype: string }>
  >([]);

  // Voice state
  const [currentVoiceChannel, setCurrentVoiceChannel] =
    useState<Channel | null>(null);
  const {
    joinVoice,
    leaveVoice,
    peers,
    isMuted,
    isDeafened,
    isSpeaking,
    latency,
    connectionQuality,
    toggleMute,
    toggleDeafen,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    screenShare,
  } = useVoice(currentVoiceChannel?.id || null);

  const typingTimeoutsRef = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileChannelRef = useRef<HTMLDivElement | null>(null);

  const hasAutoSwitchedToOnline = useRef(false);

  // Auto-set status to online if offline on load - RUNS ONLY ONCE
  useEffect(() => {
    if (user && user.status === "offline" && !hasAutoSwitchedToOnline.current) {
      hasAutoSwitchedToOnline.current = true;
      setUser({ ...user, status: "online" });
    }
  }, [user, setUser]);

  // Close mobile channel dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMobileChannelDropdown) return;

    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (mobileChannelRef.current && !mobileChannelRef.current.contains(target)) {
        setShowMobileChannelDropdown(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMobileChannelDropdown(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMobileChannelDropdown]);

  // Redirect to login if not authenticated or loading is done
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading]);

  // Authenticate socket when user/socket changes
  useEffect(() => {
    if (socket && user?.id) {
      // Only send online if we are actually online or just switched
      const statusToSend = user.status === "offline" ? "online" : user.status;
      socket.emit("authenticate", { userId: user.id, status: statusToSend });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadServers();
      loadDMConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (message: Message) => {
      // Check if message belongs to current view
      const isCurrentChannelMessage =
        currentChannel && message.channelId === currentChannel.id;
      const isCurrentDMMessage =
        currentDM &&
        message.dmUserId &&
        ((message.dmUserId === currentDM.id && message.user.id === user?.id) || // I sent to currentDM
          (message.dmUserId === user?.id && message.user.id === currentDM.id)); // currentDM sent to me

      if (isCurrentChannelMessage || isCurrentDMMessage) {
        setMessages((prev) => [...prev, message]);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        // Mark as unread
        if (message.channelId) {
          setUnreadChannels((prev) => {
            const next = new Set(prev);
            next.add(message.channelId!);
            return next;
          });
        } else if (message.dmUserId) {
          // Mark the DM partner as unread
          const dmPartnerId =
            message.user.id === user?.id ? message.dmUserId : message.user.id;
          setUnreadDMs((prev) => {
            const next = new Set(prev);
            next.add(dmPartnerId);
            return next;
          });
        }
      }
    });

    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on("user_typing", (data: any) => {
      if (currentChannel && data.channelId === currentChannel.id) {
        setTypingUsers((prev) => new Set(prev).add(data.displayName));

        // Clear typing after 3 seconds
        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }

        typingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.displayName);
            return newSet;
          });
        }, 3000);
      }
    });

    socket.on(
      "user_status",
      (data: { userId: string; status: string; customStatus?: string }) => {
        // Update server members status
        if (currentServer) {
          setCurrentServer((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              members: prev.members.map((m: any) => {
                if (m.user.id === data.userId) {
                  return {
                    ...m,
                    user: {
                      ...m.user,
                      status: data.status,
                      customStatus: data.customStatus,
                    },
                  };
                }
                return m;
              }),
            };
          });
        }

        // Update DM status if applicable
        if (currentDM && currentDM.id === data.userId) {
          setCurrentDM((prev: any) => ({
            ...prev,
            status: data.status,
            customStatus: data.customStatus,
          }));
        }
      }
    );

    socket.on("user_updated", (updatedUser: any) => {
      // Update server members
      if (currentServer) {
        setCurrentServer((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.map((m: any) => {
              if (m.user.id === updatedUser.id) {
                return { ...m, user: { ...m.user, ...updatedUser } };
              }
              return m;
            }),
          };
        });
      }

      // Update DM conversations
      setDmConversations((prev) =>
        prev.map((c) =>
          c.id === updatedUser.id ? { ...c, ...updatedUser } : c
        )
      );

      // Update current DM if active
      if (currentDM && currentDM.id === updatedUser.id) {
        setCurrentDM((prev: any) => ({ ...prev, ...updatedUser }));
      }

      // Update messages (sender info)
      setMessages((prev) =>
        prev.map((m) => {
          if (m.user.id === updatedUser.id) {
            return { ...m, user: { ...m.user, ...updatedUser } };
          }
          return m;
        })
      );
    });

    socket.on("member_removed", ({ serverId, userId }: { serverId: string; userId: string }) => {
      if (currentServer?.id === serverId) {
        setCurrentServer((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.filter((m: any) => m.user.id !== userId),
          };
        });
      }
    });

    socket.on("member_kicked", ({ serverId, redirectToFriends }: { serverId: string; redirectToFriends?: boolean }) => {
      if (redirectToFriends && user?.id) {
        setViewMode("dm");
        setShowFriends(true);
        setCurrentServer(null);
        setCurrentChannel(null);
        return;
      }
      if (currentServer?.id === serverId) {
        loadServers();
        if (currentServer) selectServer(currentServer.id);
      }
    });

    socket.on("member_banned", ({ serverId, redirectToFriends }: { serverId: string; redirectToFriends?: boolean }) => {
      if (redirectToFriends && user?.id) {
        setViewMode("dm");
        setShowFriends(true);
        setCurrentServer(null);
        setCurrentChannel(null);
        return;
      }
      if (currentServer?.id === serverId) {
        loadServers();
        if (currentServer) selectServer(currentServer.id);
      }
    });

    socket.on("friend_request_received", () => {
      // Notification will be handled by Friends component
    });

    socket.on("member_unbanned", ({ serverId }: { serverId: string }) => {
      if (currentServer?.id === serverId) {
        loadServers();
        if (currentServer) selectServer(currentServer.id);
      }
    });

    socket.on("server_members_updated", ({ serverId }: { serverId: string }) => {
      if (currentServer?.id === serverId) {
        loadServers();
        if (currentServer) selectServer(currentServer.id);
      }
    });


    socket.on("channel_created", (channel: Channel) => {
      if (currentServer && channel.serverId === currentServer.id) {
        setCurrentServer((prev: any) => ({
          ...prev,
          channels: [...prev.channels, channel].sort(
            (a, b) => a.position - b.position
          ),
        }));
      }
    });

    socket.on("channel_updated", (updatedChannel: Channel) => {
      if (currentServer && updatedChannel.serverId === currentServer.id) {
        setCurrentServer((prev: any) => ({
          ...prev,
          channels: prev.channels.map((c: Channel) =>
            c.id === updatedChannel.id ? updatedChannel : c
          ),
        }));
        if (currentChannel?.id === updatedChannel.id) {
          setCurrentChannel(updatedChannel);
        }
      }
    });

    socket.on(
      "channel_deleted",
      (data: { channelId: string; serverId: string }) => {
        if (currentServer && data.serverId === currentServer.id) {
          setCurrentServer((prev: any) => ({
            ...prev,
            channels: prev.channels.filter(
              (c: Channel) => c.id !== data.channelId
            ),
          }));
          if (currentChannel?.id === data.channelId) {
            setCurrentChannel(null);
          }
        }
      }
    );

    socket.on("server_updated", (updatedServer: any) => {
      setServers((prev) =>
        prev.map((s) => (s.id === updatedServer.id ? updatedServer : s))
      );
      if (currentServer?.id === updatedServer.id) {
        setCurrentServer((prev: any) => ({ ...prev, ...updatedServer }));
      }
    });

    socket.on("server_deleted", (serverId: string) => {
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      if (currentServer?.id === serverId) {
        setCurrentServer(null);
        setCurrentChannel(null);
      }
    });

    socket.on("member_joined", (data: { serverId: string; user: any }) => {
      if (currentServer && data.serverId === currentServer.id) {
        setCurrentServer((prev: any) => ({
          ...prev,
          members: [
            ...prev.members,
            { userId: data.user.id, role: "member", user: data.user },
          ],
          _count: { ...prev._count, members: prev._count.members + 1 },
        }));
      }
    });

    socket.on("member_left", (data: { serverId: string; userId: string }) => {
      if (currentServer && data.serverId === currentServer.id) {
        if (data.userId === user?.id) {
          // I left/was kicked
          setCurrentServer(null);
          setCurrentChannel(null);
        } else {
          setCurrentServer((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.user.id !== data.userId),
            _count: { ...prev._count, members: prev._count.members - 1 },
          }));
        }
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("message_deleted");
      socket.off("user_typing");
      socket.off("user_status");
      socket.off("user_updated");
      socket.off("channel_created");
      socket.off("channel_updated");
      socket.off("channel_deleted");
      socket.off("server_updated");
      socket.off("server_deleted");
      socket.off("member_joined");
      socket.off("member_removed");
      socket.off("member_kicked");
      socket.off("member_banned");
      socket.off("member_unbanned");
      socket.off("member_left");
    };
  }, [socket, currentChannel, currentDM, currentServer, user]);

  useEffect(() => {
    if (currentDM) {
      // Mark DM as read
      setUnreadDMs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentDM.id);
        return newSet;
      });
    }
  }, [currentDM]);

  useEffect(() => {
    if (currentChannel) {
      loadMessages(currentChannel.id);
      socket?.emit("join_channel", currentChannel.id);
      setTypingUsers(new Set());

      // Mark channel as read
      setUnreadChannels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentChannel.id);
        return newSet;
      });

      return () => {
        socket?.emit("leave_channel", currentChannel.id);
      };
    }
  }, [currentChannel, socket]);

  useEffect(() => {
    if (currentDM) {
      // Mark DM as read
      setUnreadDMs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentDM.id);
        return newSet;
      });
    }
  }, [currentDM]);

  // Trigger voice join when channel is set
  useEffect(() => {
    if (currentVoiceChannel?.id && socket?.connected) {
      // Small delay to ensure auth is processed
      const timer = setTimeout(() => {
        joinVoice();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!currentVoiceChannel?.id) {
      leaveVoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVoiceChannel?.id, socket?.connected, joinVoice]);

  const loadServers = async () => {
    try {
      const res = await axios.get(`${API_URL}/servers`, {
        withCredentials: true,
      });
      setServers(res.data);
      if (res.data.length > 0) {
        selectServer(res.data[0].id);
      }
    } catch (error) {}
  };

  const selectServer = async (serverId: string) => {
    try {
      setShowFriends(false);
      setViewMode("server");
      setCurrentDM(null);
      const res = await axios.get(`${API_URL}/servers/${serverId}`, {
        withCredentials: true,
      });
      setCurrentServer(res.data);
      if (res.data.channels?.length > 0) {
        const textChannel = res.data.channels.find(
          (c: any) => c.type === "text"
        );
        setCurrentChannel(textChannel || res.data.channels[0]);
      }
    } catch (error) {}
  };

  const selectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    // Mark channel as read when selecting
    setUnreadChannels((prev) => {
      const next = new Set(prev);
      next.delete(channel.id);
      return next;
    });
    // Mark as read on server
    if (socket && user) {
      socket.emit('mark_read', { channelId: channel.id });
    }

    if (channel.type === "voice") {
      if (currentVoiceChannel?.id === channel.id) {
        return;
      }
      setCurrentVoiceChannel(channel);
    }
  };

  const disconnectVoice = () => {
    setCurrentVoiceChannel(null);
    // Rediriger vers un channel textuel du même serveur
    if (currentServer?.channels) {
      const textChannel = currentServer.channels.find(
        (c: any) => c.type === "text"
      );
      if (textChannel) {
        setCurrentChannel(textChannel);
      }
    }
  };

  const voiceuserInVoice = peers.map((peer) => {
    const member = currentServer?.members?.find(
      (m: any) => m.user.id === peer.userId
    );

    return {
      id: peer.userId,
      socketId: peer.socketId,
      displayName: member?.user?.displayName || peer.displayName,
      avatar: member?.user?.avatar || peer.avatar,
      isSpeaking: peer.isSpeaking,
    };
  });

  const loadDMConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/dms/conversations`, {
        withCredentials: true,
      });
      setDmConversations(res.data);
    } catch (error) {}
  };

  const selectDM = async (dmUser: any) => {
    try {
      setViewMode("dm");
      setCurrentServer(null);
      setCurrentChannel(null);
      setCurrentDM(dmUser);
      setShowFriends(false);
      // Mark DM as read when selecting
      setUnreadDMs((prev) => {
        const next = new Set(prev);
        next.delete(dmUser.id);
        return next;
      });
      const res = await axios.get(`${API_URL}/dms/${dmUser.id}/messages`, {
        withCredentials: true,
      });
      setMessages(res.data);
      // Mark DM as read on server
      if (socket && user) {
        socket.emit('mark_read', { dmUserId: dmUser.id });
      }
    } catch (error) {}
  };

  const loadMessages = async (channelId: string) => {
    try {
      const res = await axios.get(`${API_URL}/channels/${channelId}/messages`, {
        withCredentials: true,
      });
      setMessages(res.data);
      // Mark channel as read when opening
      if (socket && user) {
        socket.emit('mark_read', { channelId });
      }
    } catch (error) {}
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotification(`File ${file.name} is too large. Maximum size is 100MB.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingFiles(validFiles);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post(`${API_URL}/upload`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploaded]);
      setUploadingFiles([]);
    } catch (error: any) {
      showNotification(error?.response?.data?.error || "Failed to upload files", "error");
      setUploadingFiles([]);
    }
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && uploadedFiles.length === 0) || !user) {
      return;
    }

    let content = messageInput;
    if (uploadedFiles.length > 0) {
      const fileLinks = uploadedFiles
        .map((f) => `[${f.filename}](${f.url})`)
        .join("\n");
      content = content ? `${content}\n${fileLinks}` : fileLinks;
    }

    if (viewMode === "dm" && currentDM) {
      try {
        const res = await axios.post(
          `${API_URL}/dms/${currentDM.id}/messages`,
          {
            content,
            replyToId: replyingTo?.id,
          },
          { withCredentials: true }
        );
        setMessages([...messages, res.data]);
        setMessageInput("");
        setReplyingTo(null);
        setUploadedFiles([]);
      } catch (error) {}
    } else if (currentChannel) {
      socket?.emit("send_message", {
        channelId: currentChannel.id,
        content,
        userId: user.id,
        replyToId: replyingTo?.id,
      });
      setMessageInput("");
      setReplyingTo(null);
      setUploadedFiles([]);
    }
  };

  const handleTyping = () => {
    if (!currentChannel || !user) return;
    socket?.emit("typing", {
      channelId: currentChannel.id,
      userId: user.id,
      displayName: user.displayName,
    });
  };

  const deleteMessage = async (messageId: string, isDM: boolean = false) => {
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?',
      async () => {
        try {
          if (isDM && currentDM) {
            await axios.delete(`${API_URL}/dms/messages/${messageId}`, {
              withCredentials: true,
            });
          } else {
            socket?.emit("delete_message", {
              messageId,
              userId: user?.id,
            });
          }

          // Remove from UI
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          showNotification('Message deleted', 'success');
        } catch (error) {
          showNotification('Failed to delete message', 'error');
        }
      },
      undefined,
      'Delete',
      'Cancel'
    );
  };

  const handleLeaveServer = async () => {
    if (!currentServer || !user) return;

    showConfirm(
      'Leave Server',
      `Are you sure you want to leave ${currentServer.name}?`,
      async () => {
        try {
          await axios.post(
            `${API_URL}/servers/${currentServer.id}/leave`,
            {},
            { withCredentials: true }
          );
          setServers((prev) => prev.filter((s) => s.id !== currentServer.id));
          setCurrentServer(null);
          setCurrentChannel(null);
          showNotification('You have left the server', 'success');
        } catch (error: any) {
          showNotification(error?.response?.data?.error || 'Failed to leave server', 'error');
        }
      },
      undefined,
      'Leave',
      'Cancel'
    );
  };

  const openCreateChannel = () => {
    setChannelModalMode("create");
    setEditingChannel(null);
    setShowChannelModal(true);
  };

  const openEditChannel = (channel: Channel) => {
    setChannelModalMode("edit");
    setEditingChannel(channel);
    setShowChannelModal(true);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <div className="home-container">
        {/* Server Sidebar */}
        <div className="server-sidebar">
          <div
            className="server-icon home-icon"
            role="button"
            tabIndex={0}
            onClick={() => {
              setShowFriends(true);
              setViewMode("dm");
              setCurrentServer(null);
              setCurrentChannel(null);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setShowFriends(true); setViewMode('dm'); setCurrentServer(null); setCurrentChannel(null); } }}
            title="Friends"
            aria-label="Friends"
          >
            <UsersIcon size={20} />
          </div>

          {/* Settings icon - directly below home-icon */}
          <div
            className="server-icon settings-icon"
            role="button"
            tabIndex={0}
            onClick={() => setShowSettings(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowSettings(true); }}
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </div>

          <div className="server-divider"></div>
          {servers.map((server) => (
            <div
              key={server.id}
              className={`server-icon ${
                currentServer?.id === server.id ? "active" : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => selectServer(server.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectServer(server.id); }}
              style={
                server.icon
                  ? {
                      backgroundImage: `url('${server.icon.startsWith('http') ? server.icon : `${API_URL}${server.icon}`}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      color: "transparent",
                    }
                  : {}
              }
              title={server.name}
              aria-label={`Server ${server.name}`}
            >
              {!server.icon && server.name.substring(0, 2).toUpperCase()}
            </div>
          ))}
          <div
            className="server-icon add-server"
            role="button"
            tabIndex={0}
            onClick={() => setShowCreateServer(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCreateServer(true); }}
            aria-label="Create server"
          >
            <AddIcon size={24} />
          </div>
        </div>

        {/* Channel Sidebar - Server Mode */}
        {viewMode === "server" && currentServer && (
          <div className="channel-sidebar">
            <div className="channel-header">
              <div className="channel-header-left">
                <h2>{currentServer.name}</h2>
                {/* Mobile channel dropdown */}
                <div className="mobile-channel-selector" ref={mobileChannelRef}>
                  <button
                    className="mobile-channel-btn"
                    onClick={() => setShowMobileChannelDropdown(!showMobileChannelDropdown)}
                    title="Select Channel"
                    aria-label="Select Channel"
                    aria-expanded={showMobileChannelDropdown}
                    aria-controls="mobile-channel-dropdown"
                  >
                    {currentChannel ? `# ${currentChannel.name}` : "Select Channel"}
                  </button>
                  {showMobileChannelDropdown && (
                    <div id="mobile-channel-dropdown" className="mobile-channel-dropdown" role="menu">
                      {currentServer.channels?.map((channel: Channel) => (
                        <div
                          key={channel.id}
                          role="menuitem"
                          tabIndex={0}
                          className={`mobile-channel-item ${currentChannel?.id === channel.id ? "active" : ""}`}
                          onClick={() => {
                            selectChannel(channel);
                            setShowMobileChannelDropdown(false);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { selectChannel(channel); setShowMobileChannelDropdown(false); } }}
                        >
                          {channel.type === "voice" ? "🔊" : "#"} {channel.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="server-settings-btn"
                onClick={() =>
                  currentServer.ownerId === user?.id
                    ? setShowServerSettings(true)
                    : handleLeaveServer()
                }
                title={
                  currentServer.ownerId === user?.id
                    ? "Server Settings"
                    : "Leave Server"
                }
              >
                {currentServer.ownerId === user?.id ? (
                  <SettingsIcon size={18} />
                ) : (
                  <LogoutIcon size={18} />
                )}
              </button>
            </div>
            <div className="channel-list">
              <div className="channel-section">
                <div className="section-header">
                  <span className="section-title">TEXT CHANNELS</span>
                  {currentServer.ownerId === user?.id && (
                    <button
                      className="add-channel-btn"
                      onClick={openCreateChannel}
                    >
                      <AddIcon size={16} />
                    </button>
                  )}
                </div>
                {currentServer.channels
                  ?.filter((c: Channel) => c.type === "text")
                  .map((channel: Channel) => (
                    <div
                      key={channel.id}
                      className={`channel-item ${
                        currentChannel?.id === channel.id ? "active" : ""
                      } ${unreadChannels.has(channel.id) ? "unread" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectChannel(channel)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectChannel(channel); }}
                      aria-label={`Channel ${channel.name}`}
                    >
                      <div className="channel-item-content">
                        <HashIcon size={16} />
                        <span>{channel.name}</span>
                        {unreadChannels.has(channel.id) && (
                          <span className="unread-indicator"></span>
                        )}
                      </div>
                      {currentServer.ownerId === user?.id && (
                        <button
                          className="channel-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChannel(channel);
                          }}
                        >
                          <EditIcon size={14} />
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              <div className="channel-section">
                <div className="section-header">
                  <span className="section-title">VOICE CHANNELS</span>
                  {currentServer.ownerId === user?.id && (
                    <button
                      className="add-channel-btn"
                      onClick={openCreateChannel}
                    >
                      <AddIcon size={16} />
                    </button>
                  )}
                </div>
                {currentServer.channels
                  ?.filter((c: Channel) => c.type === "voice")
                  .map((channel: Channel) => (
                    <div
                      key={channel.id}
                      className={`channel-item ${
                        currentVoiceChannel?.id === channel.id ? "active" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectChannel(channel)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectChannel(channel); }}
                      aria-label={`Voice channel ${channel.name}`}
                    >
                      <div className="channel-item-content">
                        <VolumeUpIcon size={16} />
                        <span>{channel.name}</span>
                      </div>

                      {currentServer.ownerId === user?.id && (
                        <button
                          className="channel-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChannel(channel);
                          }}
                        >
                          <EditIcon size={14} />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* User Panel - Always visible */}
            <div className="user-panel">
              <div
                className="user-info-wrapper"
                onClick={() => setShowStatusPicker(!showStatusPicker)}
              >
                <div className="status-dot-wrapper">
                  <img
                    src={user?.avatar || "https://via.placeholder.com/32"}
                    alt="avatar"
                    className="user-avatar"
                  />
                  <div
                    className={`status-dot-user status-${
                      user?.status || "offline"
                    }`}
                  ></div>
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.displayName}</div>
                  <div className="user-status-text text-secondary">
                    {user?.customStatus ||
                      (user?.status === "dnd"
                        ? "Do Not Disturb"
                        : user?.status
                        ? user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)
                        : "Offline")}
                  </div>
                </div>
              </div>
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Channel Sidebar - DM Mode */}
        {viewMode === "dm" && (
          <div className="channel-sidebar">
            <div className="channel-header">
              <h2>Direct Messages</h2>
            </div>
            <div className="channel-list">
              {dmConversations.map((conv: any) => (
                <div
                  key={conv.id}
                  className={`channel-item ${
                    currentDM?.id === conv.id ? "active" : ""
                  } ${unreadDMs.has(conv.id) ? "unread" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectDM(conv)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectDM(conv); }}
                  aria-label={`Direct message ${conv.displayName}`}
                >
                  <span>{conv.displayName}</span>
                  {unreadDMs.has(conv.id) && (
                    <span className="unread-indicator"></span>
                  )}
                </div>
              ))}
            </div>
            <div className="user-panel">
              <div
                className="user-info-wrapper"
                onClick={() => setShowStatusPicker(!showStatusPicker)}
              >
                <div className="status-dot-wrapper">
                  <img
                    src={user?.avatar || "https://via.placeholder.com/32"}
                    alt="avatar"
                    className="user-avatar"
                  />
                  <div
                    className={`status-dot-user status-${
                      user?.status || "offline"
                    }`}
                  ></div>
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.displayName}</div>
                  <div className="user-status-text text-secondary">
                    {user?.customStatus ||
                      (user?.status === "dnd"
                        ? "Do Not Disturb"
                        : user?.status
                        ? user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)
                        : "Offline")}
                  </div>
                </div>
              </div>
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Voice Channel - Show VoiceStage */}
          {currentChannel?.type === "voice" &&
          currentVoiceChannel?.id === currentChannel.id ? (
            <VoiceStage
              channelName={currentChannel.name}
              userInVoice={voiceuserInVoice}
              localUser={{
                id: user?.id || "me",
                displayName: user?.displayName || "Me",
                avatar: user?.avatar,
                isMuted,
                isSpeaking,
              }}
              latency={latency}
              connectionQuality={connectionQuality}
              isMuted={isMuted}
              isDeafened={isDeafened}
              onToggleMute={toggleMute}
              onToggleDeafen={toggleDeafen}
              onDisconnect={disconnectVoice}
              isScreenSharing={isScreenSharing}
              screenShare={screenShare}
              onStartScreenShare={startScreenShare}
              onStopScreenShare={stopScreenShare}
            />
          ) : (
            /* Text Channel or DM - Show Messages */
            <>
              <div className="content-header">
                <div className="channel-name">
                  {viewMode === "dm" && currentDM
                    ? `@ ${currentDM.displayName}`
                    : currentChannel?.type === "voice"
                    ? `${currentChannel.name}`
                    : `# ${currentChannel?.name || "general"}`}
                </div>
              </div>
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <h1>
                      Welcome to{" "}
                      {viewMode === "dm" && currentDM
                        ? currentDM.displayName
                        : `#${currentChannel?.name || "general"}`}
                      ! 🎉
                    </h1>
                    <p>This is the start of your conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="message">
                      <div className="message-avatar-wrapper">
                        <img
                          src={
                            msg.user.avatar || "https://via.placeholder.com/40"
                          }
                          alt="avatar"
                          className="message-avatar"
                        />
                        {currentServer?.members?.find(
                          (m: any) => m.user.id === msg.user.id
                        )?.user.status && (
                          <div
                            className={`status-dot-small status-${
                              currentServer.members.find(
                                (m: any) => m.user.id === msg.user.id
                              ).user.status
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">
                            {msg.user.displayName}
                          </span>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {msg.replyTo && (
                          <div className="message-reply-preview">
                            <span className="reply-author">
                              @{msg.replyTo.user.displayName}
                            </span>
                            <span className="reply-content">
                              {msg.replyTo.content}
                            </span>
                          </div>
                        )}
                        <div className="message-text">
                          {msg.content.split("\n").map((line, idx) => {
                            const linkMatch = line.match(
                              /\[([^\]]+)\]\(([^)]+)\)/
                            );
                            if (linkMatch) {
                              const [, filename, url] = linkMatch;
                              const isImage =
                                /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                              return (
                                <div key={idx} className="message-attachment">
                                  {isImage ? (
                                    <img
                                      src={`${API_URL}${url}`}
                                      alt={filename}
                                      className="message-image"
                                    />
                                  ) : (
                                    <a
                                      href={`${API_URL}${url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="message-file-link"
                                    >
                                      <UploadIcon size={16} /> {filename}
                                    </a>
                                  )}
                                </div>
                              );
                            }
                            return <div key={idx}>{line || "\u00A0"}</div>;
                          })}
                        </div>
                      </div>
                      <div className="message-actions">
                        <button
                          className="message-reply-btn"
                          onClick={() => setReplyingTo(msg)}
                          title="Reply"
                        >
                          <ReplyIcon size={14} />
                        </button>
                        {(msg.user.id === user?.id || (viewMode === "server" && currentServer?.ownerId === user?.id)) && (
                          <button
                            className="message-delete-btn"
                            onClick={() =>
                              deleteMessage(msg.id, viewMode === "dm")
                            }
                            title="Delete"
                            aria-label="Delete message"
                          >
                            <DeleteIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="message-input-container">
                {typingUsers.size > 0 && (
                  <div className="typing-indicator">
                    {Array.from(typingUsers).join(", ")} is typing...
                  </div>
                )}
                {replyingTo && (
                  <div className="replying-to-bar">
                    <span>
                      Replying to <strong>{replyingTo.user.displayName}</strong>
                    </span>
                    <button onClick={() => setReplyingTo(null)}>×</button>
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-preview">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="uploaded-file-item">
                        <span>{file.filename}</span>
                        <button
                          onClick={() =>
                            setUploadedFiles((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="remove-file-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadingFiles.length > 0 && (
                  <div className="uploading-files">
                    Uploading {uploadingFiles.length} file(s)...
                  </div>
                )}
                <div className="message-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <label
                    htmlFor="file-upload"
                    className="file-upload-btn"
                    title="Upload file"
                  >
                    <UploadIcon size={18} />
                  </label>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={
                      viewMode === "dm" && currentDM
                        ? `Message @${currentDM.displayName}`
                        : `Message #${currentChannel?.name || "general"}`
                    }
                    className="message-input"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Members Sidebar - Server Mode Only */}
        {viewMode === "server" && currentServer && (
          <div className="members-sidebar">
            <MemberList
              members={currentServer.members?.map((m: any) => ({
                id: m.user.id,
                displayName: m.user.displayName,
                username: m.user.username,
                avatar: m.user.avatar,
                status: m.user.status,
                customStatus: m.user.customStatus,
                role: m.role === "admin" ? "admin" : m.role === "moderator" ? "moderator" : "member",
              })) || []}
              currentUserId={user?.id}
              serverId={currentServer.id}
              serverOwnerId={currentServer.ownerId}
            />
          </div>
        )}
      </div>
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onSuccess={loadServers}
        />
      )}
      {showChannelModal && currentServer && (
        <ChannelModal
          serverId={currentServer.id}
          channel={editingChannel || undefined}
          mode={channelModalMode}
          onClose={() => setShowChannelModal(false)}
          onSuccess={() => selectServer(currentServer.id)}
        />
      )}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showServerSettings && currentServer && (
        <ServerSettings
          server={currentServer}
          onClose={() => setShowServerSettings(false)}
          onSuccess={() => selectServer(currentServer.id)}
        />
      )}
      {showFriends && (
        <Friends
          onClose={() => setShowFriends(false)}
          selectDM={selectDM}
          setShowSettings={setShowSettings}
          onPendingCountChange={setPendingFriendRequestsCount}
        />
      )}
      
      {/* Notification badges */}
      {pendingFriendRequestsCount > 0 && (
        <div className="notification-badge friends" onClick={() => setShowFriends(true)} title="Pending friend requests">
          {pendingFriendRequestsCount > 99 ? "99+" : pendingFriendRequestsCount}
        </div>
      )}
      {showStatusPicker && (
        <UserStatusPicker
          onClose={() => setShowStatusPicker(false)}
          position={{ bottom: 60, left: 80 }}
        />
      )}
      <BetaExpiryNotice />
    </>
  );
};

export default Home;
