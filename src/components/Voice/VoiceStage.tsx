import React, { useEffect, useRef } from "react";
import { SignalIcon, HeadphoneIcon, MicOffIcon } from "../Icons";
import VoiceControls from "./VoiceControls";

type ConnectionQuality = "excellent" | "good" | "fair" | "poor";

interface VoiceUser {
  id: string;
  socketId?: string;
  displayName: string;
  avatar?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

interface ScreenShareState {
  userId: string;
  displayName: string;
  stream: MediaStream;
}

interface VoiceStageProps {
  channelName: string;
  userInVoice: VoiceUser[];
  localUser: VoiceUser;
  latency: number | null;
  connectionQuality: ConnectionQuality;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  isScreenSharing: boolean;
  screenShare: ScreenShareState | null;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
}

const qualityLabel: Record<ConnectionQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const VoiceStage: React.FC<VoiceStageProps> = ({
  channelName,
  userInVoice,
  localUser,
  latency,
  connectionQuality,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  isScreenSharing,
  screenShare,
  onStartScreenShare,
  onStopScreenShare,
}) => {
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (screenVideoRef.current && screenShare?.stream) {
      screenVideoRef.current.srcObject = screenShare.stream;
    }
  }, [screenShare]);

  return (
    <div className="voice-stage">
      <div className="voice-stage-header">
        <div className="voice-stage-header-content">
          <div className="voice-stage-info">
            <div className="voice-stage-title-row">
              <div className="flex items-center gap-md">
                <HeadphoneIcon size={24} />
                <h2 className="voice-stage-title">{channelName}</h2>
              </div>
              <div
                className={`voice-connection-badge quality-${connectionQuality}`}
              >
                <SignalIcon size={14} />
                <span>{latency !== null ? `${latency}ms` : "--"}</span>
              </div>
            </div>
            <div className="voice-stage-metadata">
              <div className="voice-metadata-item">
                <span className="metadata-label">Connection:</span>
                <span className={`metadata-value quality-${connectionQuality}`}>
                  {qualityLabel[connectionQuality]}
                </span>
              </div>
              <div className="voice-metadata-item">
                <span className="metadata-label">User in voice:</span>
                <span className="metadata-value">
                  {userInVoice.length + 1}
                </span>
              </div>
              <div className="voice-metadata-item">
                <span className="metadata-label">Status:</span>
                <span className="metadata-value status-connected">
                  VOICE CONNECTED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="voice-stage-main">
        <div className="voice-stage-center">
          {screenShare && (
            <div className="voice-share-container">
              <div className="voice-share-header">
                <span>{screenShare.displayName} is sharing their screen</span>
                {screenShare.userId === localUser.id ? (
                  <button onClick={onStopScreenShare}>Stop Sharing</button>
                ) : null}
              </div>
              <div className="voice-share-video">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted={screenShare.userId === localUser.id}
                />
              </div>
            </div>
          )}
        </div>

        <div className="voice-stage-users-sidebar">
          <div className="voice-users-sidebar-header">
            <span>{userInVoice.length + 1} in channel</span>
          </div>
          <div className="voice-users-sidebar-list">
            {[localUser, ...userInVoice].map((user) => (
              <div
                key={user.id}
                className={`voice-user-sidebar-item ${user.isSpeaking ? "speaking" : ""}`}
              >
                <div className="voice-user-sidebar-avatar">
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.displayName
                      )}&background=0a0a0a&color=ffffff`
                    }
                    alt={user.displayName}
                  />
                  {user.isSpeaking && (
                    <div className="voice-user-sidebar-speaking-indicator"></div>
                  )}
                </div>
                <div className="voice-user-sidebar-info">
                  <div className="voice-user-sidebar-name">{user.displayName}</div>
                  {user.id === localUser.id && (
                    <div className="voice-user-sidebar-badge">You</div>
                  )}
                </div>
                {user.isMuted && (
                  <div className="voice-user-sidebar-muted">
                    <MicOffIcon size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <VoiceControls
        isMuted={isMuted}
        isDeafened={isDeafened}
        onToggleMute={onToggleMute}
        onToggleDeafen={onToggleDeafen}
        onDisconnect={onDisconnect}
        channelName={channelName}
        isScreenSharing={isScreenSharing}
        onStartScreenShare={onStartScreenShare}
        onStopScreenShare={onStopScreenShare}
      />
    </div>
  );
};

export default VoiceStage;
