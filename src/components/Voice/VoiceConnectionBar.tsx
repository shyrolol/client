import React, { useState, useEffect } from "react";
import {
  MicIcon,
  MicOffIcon,
  HeadphoneIcon,
  HeadphoneOffIcon,
  PhoneOffIcon,
} from "../Icons";

interface VoiceConnectionBarProps {
  channelName?: string;
  serverName?: string;
  isMuted: boolean;
  isDeafened: boolean;
  status?: "good" | "poor" | "bad";
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
}

const VoiceConnectionBar: React.FC<VoiceConnectionBarProps> = ({
  channelName,
  serverName,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
}) => {
  const [ping, setPing] = useState<number>(45);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "reconnecting"
  >("connected");

  // Simulate ping updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * 100) + 20);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getPingColor = () => {
    if (ping < 50) return "#23a55a"; // Green
    if (ping < 100) return "#faa81a"; // Yellow
    return "#ed4245"; // Red
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      default:
        return "Voice Connected";
    }
  };

  return (
    <div className="voice-connection-bar">
      <div className="connection-info">
        <div className="connection-details">
          <div className="status-row">
            <span className="status-label">{getStatusText()}</span>
            <span className="ping-display" data-ping={ping}>
              {ping}ms
            </span>
          </div>
          <div
            className="channel-label"
            title={`${channelName}${serverName ? ` / ${serverName}` : ""}`}
          >
            {channelName}
            {serverName && ` / ${serverName}`}
          </div>
        </div>
      </div>

      <div className="connection-actions">
        <button
          className={`action-btn ${isMuted ? "active" : ""}`}
          onClick={onToggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOffIcon size={24} /> : <MicIcon size={24} />}
        </button>

        <button
          className={`action-btn ${isDeafened ? "active" : ""}`}
          onClick={onToggleDeafen}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? (
            <HeadphoneOffIcon size={24} />
          ) : (
            <HeadphoneIcon size={24} />
          )}
        </button>

        <button
          className="action-btn disconnect-btn"
          onClick={onDisconnect}
          title="Disconnect"
        >
          <PhoneOffIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default VoiceConnectionBar;
