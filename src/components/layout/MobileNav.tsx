import React from "react";
import { ServerIcon, UsersIcon, SettingsIcon } from "../ui/Icons";

interface Props {
  activeTab: "servers" | "friends" | "settings";
  onTabChange: (tab: "servers" | "friends" | "settings") => void;
  unreadDMs?: number;
  unreadMentions?: number;
}

const MobileNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  unreadDMs = 0,
  unreadMentions = 0,
}) => {
  return (
    <div className="mobile-nav">
      <div
        className={`mobile-nav-item ${activeTab === "servers" ? "active" : ""}`}
        onClick={() => onTabChange("servers")}
      >
        <div className="mobile-nav-icon-wrapper">
          <ServerIcon size={24} />
          {unreadMentions > 0 && (
            <div className="mobile-badge">{unreadMentions}</div>
          )}
        </div>
        <span>Servers</span>
      </div>

      <div
        className={`mobile-nav-item ${activeTab === "friends" ? "active" : ""}`}
        onClick={() => onTabChange("friends")}
      >
        <div className="mobile-nav-icon-wrapper">
          <UsersIcon size={24} />
          {unreadDMs > 0 && <div className="mobile-badge">{unreadDMs}</div>}
        </div>
        <span>Friends</span>
      </div>

      <div
        className={`mobile-nav-item ${
          activeTab === "settings" ? "active" : ""
        }`}
        onClick={() => onTabChange("settings")}
      >
        <div className="mobile-nav-icon-wrapper">
          <SettingsIcon size={24} />
        </div>
        <span>You</span>
      </div>
    </div>
  );
};

export default MobileNav;
