import React from "react";
import {
  MicIcon,
  MicOffIcon,
  HeadphoneIcon,
  HeadphoneOffIcon,
  PhoneOffIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
} from "../ui/Icons";

interface VoiceControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  channelName: string;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  isMuted,
  isDeafened,
  isScreenSharing,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onStartScreenShare,
  onStopScreenShare,
  channelName,
}) => {
  return (
    <div className="voice-controls">
      <div className="voice-controls-info">
        <div className="voice-controls-status">
          <span className="voice-controls-status-dot" />
          <span className="voice-controls-status-text">Voice Connected</span>
        </div>
        <div className="voice-controls-channel">{channelName}</div>
      </div>

      <div className="voice-controls-actions">
        <button
          className={`voice-control-btn ${isMuted ? "active" : ""}`}
          onClick={onToggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
        </button>

        <button
          className={`voice-control-btn ${isDeafened ? "active" : ""}`}
          onClick={onToggleDeafen}
          title={isDeafened ? "Undeafen" : "Deafen"}
          aria-label={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? (
            <HeadphoneOffIcon size={20} />
          ) : (
            <HeadphoneIcon size={20} />
          )}
        </button>

        <button
          className={`voice-control-btn ${isScreenSharing ? "active" : ""}`}
          onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
          aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? (
            <ScreenShareOffIcon size={20} />
          ) : (
            <ScreenShareIcon size={20} />
          )}
        </button>

        <button
          className="voice-control-btn disconnect"
          onClick={onDisconnect}
          title="Leave call"
          aria-label="Leave call"
        >
          <PhoneOffIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default VoiceControls;
