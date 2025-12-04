import React from "react";
import { MicOffIcon } from "../ui/Icons";

interface VoiceUser {
  id: string;
  socketId?: string;
  displayName: string;
  avatar?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

interface VoiceGridProps {
  userInVoice: VoiceUser[];
  localUser: VoiceUser;
}

const VoiceGrid: React.FC<VoiceGridProps> = ({ userInVoice, localUser }) => {
  const allUsers = [localUser, ...userInVoice];

  if (allUsers.length === 0) {
    return (
      <div className="voice-grid-empty">
        <div className="voice-grid-empty-text">Nobody in the room</div>
        <div className="voice-grid-empty-hint">
          Invite your friends to get started
        </div>
      </div>
    );
  }

  return (
    <div className="voice-grid">
      {allUsers.map((user) => (
        <div
          key={user.id}
          className={`voice-tile ${user.isSpeaking ? "speaking" : ""} ${
            user.isMuted ? "muted" : ""
          }`}
        >
          <div className="voice-avatar-container">
            <div className="voice-avatar-wrapper">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.displayName
                  )}&background=0a0a0a&color=ffffff`
                }
                alt={user.displayName}
                className="voice-avatar"
              />
              {user.isSpeaking && (
                <div className="voice-speaking-indicator">
                  <div className="voice-speaking-ring"></div>
                </div>
              )}
            </div>
            {user.isMuted && (
              <div className="voice-status-badge muted">
                <MicOffIcon size={16} />
              </div>
            )}
          </div>
          <div className="voice-username">{user.displayName}</div>
          {user.id === localUser.id && (
            <div className="voice-local-badge">You</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VoiceGrid;
