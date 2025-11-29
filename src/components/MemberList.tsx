import React, { useState } from "react";
import { SearchIcon, ChevronDownIcon } from "./Icons";
import MemberContextMenu from "./MemberContextMenu";

interface Member {
  id: string;
  displayName: string;
  username?: string;
  avatar?: string;
  status?: "online" | "idle" | "dnd" | "offline";
  customStatus?: string;
  role?: "admin" | "moderator" | "member";
  joinedAt?: string;
}

interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  serverId?: string;
  serverOwnerId?: string;
}

const MemberList: React.FC<MemberListProps> = ({ members, currentUserId, serverId, serverOwnerId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

  // Group by role, then by status (online/idle/dnd together, offline separate)
  const groupedByRole = {
    admin: members.filter((m) => m.role === "admin"),
    moderator: members.filter((m) => m.role === "moderator"),
    member: members.filter((m) => !m.role || m.role === "member"),
  };

  const groupByStatus = (list: Member[]) => {
    const online = list.filter((m) => m.status === "online" || m.status === "idle" || m.status === "dnd");
    const offline = list.filter((m) => m.status === "offline" || !m.status);
    return { online, offline };
  };

  const filterMembers = (list: Member[]) =>
    list.filter((m) =>
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const toggleRole = (role: string) => {
    setExpandedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const getStatusText = (member: Member) => {
    if (member.customStatus) return member.customStatus;
    if (member.status === "online") return "Online";
    if (member.status === "idle") return "Idle";
    if (member.status === "dnd") return "Do Not Disturb";
    return "Offline";
  };

  const MemberItem = ({ member }: { member: Member }) => {
    const isOwner = serverOwnerId === currentUserId;

    return (
      <div
        className={`member-item ${
          member.id === currentUserId ? "current-user" : ""
        }`}
      >
        <div className="member-avatar-container">
          <img
            src={
              member.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                member.displayName
              )}&size=128`
            }
            alt={member.displayName}
            className="member-avatar"
          />
          <div
            className={`member-status-dot status-${member.status || "offline"}`}
            title={member.status || "offline"}
          />
        </div>

        <div className="member-info">
          <div className="member-name">
            {member.displayName}
            {member.id === currentUserId && (
              <span className="current-badge">You</span>
            )}
          </div>
          {member.username && (
            <div className="member-username">@{member.username}</div>
          )}
          <div className="member-status-text">{getStatusText(member)}</div>
        </div>

        {member.role === "admin" && (
          <div className="member-badge admin">Owner</div>
        )}
        {member.role === "moderator" && (
          <div className="member-badge moderator">Mod</div>
        )}

        {serverId && (
          <MemberContextMenu
            memberId={member.id}
            memberName={member.displayName}
            isOwner={isOwner}
            currentUserId={currentUserId}
            serverId={serverId}
            onAction={() => window.location.reload()}
          />
        )}
      </div>
    );
  };

  const MemberGroup = ({
    role,
    label,
    members: groupMembers,
  }: {
    role: string;
    label: string;
    members: Member[];
  }) => {
    const filtered = filterMembers(groupMembers);
    const isExpanded = expandedRoles.includes(role);
    const { online, offline } = groupByStatus(filtered);

    if (filtered.length === 0) return null;

    return (
      <div className="member-group">
        <button
          className="member-group-header"
          onClick={() => toggleRole(role)}
        >
          <ChevronDownIcon
            size={16}
            className={isExpanded ? "chevron-expanded" : "chevron-collapsed"}
          />
          <span className="member-group-label">
            {label} — {filtered.length}
          </span>
        </button>

        {isExpanded && (
          <div className="member-group-content">
            {online.length > 0 && (
              <>
                {online.length > 1 && (
                  <div className="member-status-group-header">
                    Online — {online.length}
                  </div>
                )}
                {online.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </>
            )}
            {offline.length > 0 && (
              <>
                {offline.length > 1 && (
                  <div className="member-status-group-header">
                    Offline — {offline.length}
                  </div>
                )}
                {offline.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const totalMembers = members.length;
  const onlineCount = members.filter((m) => m.status === "online" || m.status === "idle" || m.status === "dnd").length;

  return (
    <div className="member-list-container">
      <div className="member-list-header">
        <div className="member-list-title">Members</div>
        <div className="member-list-stats">
          {onlineCount > 0 && (
            <span className="member-stat online">{onlineCount} online</span>
          )}
          <span className="member-stat">{totalMembers} total</span>
        </div>
      </div>

      <div className="member-search-container">
        <SearchIcon size={16} className="search-icon" />
        <input
          type="text"
          className="member-search-input"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="member-list-content">
        {groupedByRole.admin.length > 0 && (
          <MemberGroup
            role="admin"
            label="Server Owner"
            members={groupedByRole.admin}
          />
        )}

        {groupedByRole.moderator.length > 0 && (
          <MemberGroup
            role="moderator"
            label="Moderators"
            members={groupedByRole.moderator}
          />
        )}

        {groupedByRole.member.length > 0 && (
          <MemberGroup
            role="member"
            label="Members"
            members={groupedByRole.member}
          />
        )}

        {filterMembers([
          ...groupedByRole.admin,
          ...groupedByRole.moderator,
          ...groupedByRole.member,
        ]).length === 0 && (
          <div className="member-list-empty">
            <p>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberList;
