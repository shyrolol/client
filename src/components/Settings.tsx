import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import {
  LogoutIcon,
  UserIcon,
  SettingsIcon,
  ShieldIcon,
  BellIcon,
  MicIcon,
} from "./Icons";
import { Input, Select, Toggle, Button } from "./ui";
import { useNotification } from "../context/NotificationContext";

interface Props {
  onClose: () => void;
}

type TabType =
  | "profile"
  | "appearance"
  | "privacy"
  | "notifications"
  | "voice"
  | "accessibility";

const Settings: React.FC<Props> = ({ onClose }) => {
  const { user, logout, setUser } = useAuth();
  const { showConfirm } = useNotification();
  const [tab, setTab] = useState<TabType>("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState((user as any)?.username || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("#ffffffff");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [dmPrivacy, setDmPrivacy] = useState("everyone");
  const [showActivity, setShowActivity] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [inputVolume, setInputVolume] = useState(100);
  const [outputVolume, setOutputVolume] = useState(100);
  const [inputDevice, setInputDevice] = useState<string>("");
  const [outputDevice, setOutputDevice] = useState<string>("");
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setInputDevices(inputs);
        setOutputDevices(outputs);
        if (inputs.length > 0 && !inputDevice) {
          setInputDevice(inputs[0].deviceId);
        }
        if (outputs.length > 0 && !outputDevice) {
          setOutputDevice(outputs[0].deviceId);
        }
      } catch (error) {
        // Silent fail
      }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const u = user as any;
      setDisplayName(u.displayName || "");
      setUsername(u.username || "");
      setTheme(u.theme || "dark");
      setAccentColor(u.accentColor || "#5865f2");
      setFontSize(u.fontSize || "medium");
      setCompactMode(u.compactMode ?? false);
      setDmPrivacy(u.dmPrivacy || "everyone");
      setShowActivity(u.showActivity ?? true);
      setEnableSounds(u.enableSounds ?? true);
      setDesktopNotifications(u.desktopNotifications ?? true);
      setInputVolume(u.inputVolume || 100);
      setOutputVolume(u.outputVolume || 100);
      setInputDevice(u.inputDevice || "");
      setOutputDevice(u.outputDevice || "");
      setEchoCancellation(u.echoCancellation ?? true);
      setNoiseSuppression(u.noiseSuppression ?? true);
      setReducedMotion(u.reducedMotion ?? false);
      setHighContrast(u.highContrast ?? false);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty("--accent-color", accentColor);
    root.style.setProperty("--accent-primary", accentColor);
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const hoverR = Math.max(0, r - 20);
    const hoverG = Math.max(0, g - 20);
    const hoverB = Math.max(0, b - 20);
    const hoverColor = `#${hoverR.toString(16).padStart(2, "0")}${hoverG
      .toString(16)
      .padStart(2, "0")}${hoverB.toString(16).padStart(2, "0")}`;
    root.style.setProperty("--accent-hover", hoverColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-base",
      fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px"
    );
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-compact",
      compactMode ? "true" : "false"
    );
  }, [compactMode]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduced-motion",
      reducedMotion ? "true" : "false"
    );
  }, [reducedMotion]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const avatarUrl = `${BASE_URL}${uploadRes.data.url}`;

      const response = await axios.patch(
        `${API_URL}/users/me`,
        { avatar: avatarUrl },
        { withCredentials: true }
      );

      if (response.data) {
        setUser(response.data);
      }

      setMessageType("success");
      setMessage("Avatar updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to upload avatar");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await axios.patch(
        `${API_URL}/users/me`,
        {
          displayName,
          username,
          theme,
          accentColor,
          fontSize,
          compactMode,
          dmPrivacy,
          showActivity,
          enableSounds,
          desktopNotifications,
          inputVolume,
          outputVolume,
          inputDevice: inputDevice || null,
          outputDevice: outputDevice || null,
          echoCancellation,
          noiseSuppression,
          reducedMotion,
          highContrast,
        },
        { withCredentials: true }
      );

      if (response.data) {
        setUser(response.data);
      }

      setMessageType("success");
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    showConfirm(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        await logout();
      },
      undefined,
      "Logout",
      "Cancel"
    );
  };

  const getTabTitle = () => {
    switch (tab) {
      case "profile":
        return "My Account";
      case "appearance":
        return "Appearance";
      case "privacy":
        return "Privacy & Safety";
      case "notifications":
        return "Notifications";
      case "voice":
        return "Voice & Video";
      case "accessibility":
        return "Accessibility";
      default:
        return "";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3>USER SETTINGS</h3>
          </div>
          <div className="settings-nav">
            <div
              className={`settings-tab ${tab === "profile" ? "active" : ""}`}
              onClick={() => setTab("profile")}
            >
              <UserIcon size={20} /> My Account
            </div>
            <div
              className={`settings-tab ${tab === "appearance" ? "active" : ""}`}
              onClick={() => setTab("appearance")}
            >
              <SettingsIcon size={20} /> Appearance
            </div>
            <div
              className={`settings-tab ${tab === "privacy" ? "active" : ""}`}
              onClick={() => setTab("privacy")}
            >
              <ShieldIcon size={20} /> Privacy & Safety
            </div>
            <div
              className={`settings-tab ${
                tab === "notifications" ? "active" : ""
              }`}
              onClick={() => setTab("notifications")}
            >
              <BellIcon size={20} /> Notifications
            </div>
            <div
              className={`settings-tab ${tab === "voice" ? "active" : ""}`}
              onClick={() => setTab("voice")}
            >
              <MicIcon size={20} /> Voice & Video
            </div>
            <div
              className={`settings-tab ${
                tab === "accessibility" ? "active" : ""
              }`}
              onClick={() => setTab("accessibility")}
            >
              <SettingsIcon size={20} /> Accessibility
            </div>
            <div className="settings-divider"></div>
            <div className="settings-tab danger" onClick={handleLogout}>
              <LogoutIcon size={20} /> Log Out
            </div>
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
            {tab === "profile" && (
              <div className="settings-section">
                <div className="profile-card">
                  <div className="profile-header-bg"></div>
                  <div className="profile-header-content">
                    <div className="profile-avatar-wrapper">
                      <div
                        className="avatar-overlay"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>Change</span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                      <img
                        src={user?.avatar || "https://via.placeholder.com/100"}
                        alt="avatar"
                        className="profile-avatar"
                      />
                    </div>
                    <div className="profile-details">
                      <div className="profile-name-row">
                        <h3>{user?.displayName || "User"}</h3>
                        <span className="profile-tag">
                          {username
                            ? `@${username}`
                            : `#${user?.id?.slice(0, 4) || "0000"}`}
                        </span>
                      </div>
                      <span className="profile-email">{user?.email}</span>
                      <div className="profile-id-row">ID: {user?.id}</div>
                    </div>
                  </div>
                </div>
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <div style={{ height: "16px" }}></div>
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  maxLength={30}
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
                    onClick={handleSaveSettings}
                    disabled={saving || !displayName.trim()}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "appearance" && (
              <div className="settings-section">
                <div className="form-group">
                  <label className="ds-form-label">Theme</label>
                  <div className="theme-selector">
                    <div
                      className={`theme-option ${
                        theme === "dark" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setTheme("dark");
                        handleSaveSettings();
                      }}
                    >
                      <div className="theme-preview dark"></div>
                      <span>Dark</span>
                    </div>
                    <div
                      className={`theme-option ${
                        theme === "light" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setTheme("light");
                        handleSaveSettings();
                      }}
                    >
                      <div className="theme-preview light"></div>
                      <span>Light</span>
                    </div>
                  </div>
                  <p className="input-hint">Theme is applied immediately</p>
                </div>

                <div className="form-group">
                  <label className="ds-form-label">Accent Color</label>
                  <div className="color-picker-container">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setAccentColor(newColor);
                        const root = document.documentElement;
                        root.style.setProperty("--accent", newColor);
                        root.style.setProperty("--accent-color", newColor);
                        root.style.setProperty("--accent-primary", newColor);
                        const r = parseInt(newColor.slice(1, 3), 16);
                        const g = parseInt(newColor.slice(3, 5), 16);
                        const b = parseInt(newColor.slice(5, 7), 16);
                        const hoverR = Math.max(0, r - 20);
                        const hoverG = Math.max(0, g - 20);
                        const hoverB = Math.max(0, b - 20);
                        const hoverColor = `#${hoverR
                          .toString(16)
                          .padStart(2, "0")}${hoverG
                          .toString(16)
                          .padStart(2, "0")}${hoverB
                          .toString(16)
                          .padStart(2, "0")}`;
                        root.style.setProperty("--accent-hover", hoverColor);
                      }}
                      className="color-picker"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                          setAccentColor(newColor);
                          const root = document.documentElement;
                          root.style.setProperty("--accent", newColor);
                          root.style.setProperty("--accent-color", newColor);
                          root.style.setProperty("--accent-primary", newColor);
                          const r = parseInt(newColor.slice(1, 3), 16);
                          const g = parseInt(newColor.slice(3, 5), 16);
                          const b = parseInt(newColor.slice(5, 7), 16);
                          const hoverR = Math.max(0, r - 20);
                          const hoverG = Math.max(0, g - 20);
                          const hoverB = Math.max(0, b - 20);
                          const hoverColor = `#${hoverR
                            .toString(16)
                            .padStart(2, "0")}${hoverG
                            .toString(16)
                            .padStart(2, "0")}${hoverB
                            .toString(16)
                            .padStart(2, "0")}`;
                          root.style.setProperty("--accent-hover", hoverColor);
                        }
                      }}
                      placeholder="#5865f2"
                      maxLength={7}
                      fullWidth={false}
                      className="flex-1"
                    />
                  </div>
                  <p className="input-hint">
                    Changes apply immediately to UI buttons and highlights
                  </p>
                </div>

                <div className="form-group">
                  <Select
                    label="Font Size"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    options={[
                      { value: "small", label: "Small (14px)" },
                      { value: "medium", label: "Medium (16px)" },
                      { value: "large", label: "Large (18px)" },
                    ]}
                  />
                </div>

                <div className="form-group">
                  <Toggle
                    label="Compact Mode"
                    description="Reduce spacing between elements for more content on screen"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                  />
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
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "privacy" && (
              <div className="settings-section">
                <div className="form-group">
                  <Select
                    label="Direct Messages"
                    value={dmPrivacy}
                    onChange={(e) => setDmPrivacy(e.target.value)}
                    options={[
                      { value: "everyone", label: "Everyone can send me DMs" },
                      {
                        value: "friends",
                        label: "Only friends can send me DMs",
                      },
                      { value: "none", label: "No one can send me DMs" },
                    ]}
                    hint="Controls who can send you direct messages"
                  />
                </div>

                <div className="form-group">
                  <Toggle
                    label="Show Activity Status"
                    description="Allow others to see when you are online and what you are doing"
                    checked={showActivity}
                    onChange={(e) => setShowActivity(e.target.checked)}
                  />
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
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "notifications" && (
              <div className="settings-section">
                <div className="form-group">
                  <Toggle
                    label="Enable Notification Sounds"
                    description="Play a sound when you receive a new message"
                    checked={enableSounds}
                    onChange={(e) => setEnableSounds(e.target.checked)}
                  />
                </div>

                <div className="form-group">
                  <Toggle
                    label="Desktop Notifications"
                    description="Show desktop notifications for new messages"
                    checked={desktopNotifications}
                    onChange={(e) => setDesktopNotifications(e.target.checked)}
                  />
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
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "voice" && (
              <div className="settings-section">
                <div className="form-group">
                  <Select
                    label="Input Device"
                    value={inputDevice}
                    onChange={(e) => setInputDevice(e.target.value)}
                    options={
                      inputDevices.length > 0
                        ? inputDevices.map((device) => ({
                            value: device.deviceId,
                            label:
                              device.label ||
                              `Microphone ${device.deviceId.slice(0, 8)}`,
                          }))
                        : [{ value: "", label: "No input devices found" }]
                    }
                    hint="Select your microphone input device"
                  />
                </div>

                <div className="form-group">
                  <label className="ds-form-label">Input Volume</label>
                  <div className="volume-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={inputVolume}
                      onChange={(e) => setInputVolume(parseInt(e.target.value))}
                      className="volume-slider-native"
                      style={{
                        width: "100%",
                        accentColor: "var(--accent-color)",
                      }}
                    />
                    <span className="volume-value">{inputVolume}%</span>
                  </div>
                </div>

                <div className="form-group">
                  <Select
                    label="Output Device"
                    value={outputDevice}
                    onChange={(e) => setOutputDevice(e.target.value)}
                    options={
                      outputDevices.length > 0
                        ? outputDevices.map((device) => ({
                            value: device.deviceId,
                            label:
                              device.label ||
                              `Speaker ${device.deviceId.slice(0, 8)}`,
                          }))
                        : [{ value: "", label: "No output devices found" }]
                    }
                    hint="Select your audio output device"
                  />
                </div>

                <div className="form-group">
                  <label className="ds-form-label">Output Volume</label>
                  <div className="volume-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={outputVolume}
                      onChange={(e) =>
                        setOutputVolume(parseInt(e.target.value))
                      }
                      className="volume-slider-native"
                      style={{
                        width: "100%",
                        accentColor: "var(--accent-color)",
                      }}
                    />
                    <span className="volume-value">{outputVolume}%</span>
                  </div>
                </div>

                <div className="form-group">
                  <Toggle
                    label="Echo Cancellation"
                    description="Reduce echo in your voice calls"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                  />
                </div>

                <div className="form-group">
                  <Toggle
                    label="Noise Suppression"
                    description="Filter out background noise automatically"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                  />
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
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {tab === "accessibility" && (
              <div className="settings-section">
                <div className="form-group">
                  <Toggle
                    label="Reduced Motion"
                    description="Minimize animations and transitions"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                  />
                </div>

                <div className="form-group">
                  <Toggle
                    label="High Contrast"
                    description="Increase color contrast for better visibility"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                  />
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
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
