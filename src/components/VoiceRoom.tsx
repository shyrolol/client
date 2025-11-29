import React from "react";
import {
  MicIcon,
  MicOffIcon,
  HeadphoneIcon,
  HeadphoneOffIcon,
  PhoneOffIcon,
} from "./Icons";

interface VoiceUser {
  id: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface VoiceRoomProps {
  channelName: string;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  users: VoiceUser[];
  localUser: VoiceUser;
}

const VoiceRoom: React.FC<VoiceRoomProps> = ({
  channelName,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  users,
  localUser,
}) => {
  const allUsers = [localUser, ...users];

  return (
    <div className="voice-room">
      {/* Header */}
      <div className="voice-room-header">
        <div className="voice-room-info">
          <div className="voice-room-title">Voice Channel</div>
          <div className="voice-room-channel">{channelName}</div>
        </div>
        <button
          className="voice-room-close"
          onClick={onDisconnect}
          title="Leave"
        >
          <PhoneOffIcon size={20} />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="voice-room-controls">
        <button
          className={`voice-btn ${isMuted ? "active" : ""}`}
          onClick={onToggleMute}
          title={isMuted ? "Unmute (Ctrl+M)" : "Mute (Ctrl+M)"}
        >
          {isMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
          <span>{isMuted ? "Muted" : "Unmuted"}</span>
        </button>

        <button
          className={`voice-btn ${isDeafened ? "active" : ""}`}
          onClick={onToggleDeafen}
          title={isDeafened ? "Undeafen (Ctrl+D)" : "Deafen (Ctrl+D)"}
        >
          {isDeafened ? (
            <HeadphoneOffIcon size={20} />
          ) : (
            <HeadphoneIcon size={20} />
          )}
          <span>{isDeafened ? "Deafened" : "Hearing"}</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="voice-room-users">
        <div className="voice-room-users-header">
          {allUsers.length} in channel
        </div>

        <div className="voice-users-grid">
          {allUsers.map((user) => (
            <div
              key={user.id}
              className={`voice-user-tile ${user.isSpeaking ? "speaking" : ""}`}
            >
              <div className="voice-user-avatar">
                <img
                  src={user.avatar || "https://via.placeholder.com/80"}
                  alt={user.displayName}
                />
                {user === localUser && (
                  <div className="voice-user-badge">You</div>
                )}
              </div>

              <div className="voice-user-name">{user.displayName}</div>

              <div className="voice-user-status">
                {user.isMuted && (
                  <span className="status-badge muted" title="Muted">
                    <MicOffIcon size={14} />
                  </span>
                )}
                {user.isDeafened && (
                  <span className="status-badge deafened" title="Deafened">
                    <HeadphoneOffIcon size={14} />
                  </span>
                )}
                {user.isSpeaking && !user.isMuted && (
                  <span className="status-badge speaking" title="Speaking">
                    🔊
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {allUsers.length === 1 && (
        <div className="voice-room-empty">
          <p>You're alone in this voice channel</p>
          <p className="hint">Waiting for others to join...</p>
        </div>
      )}
    </div>
  );
};

export default VoiceRoom;
