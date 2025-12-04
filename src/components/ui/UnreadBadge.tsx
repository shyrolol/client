import React from "react";

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  className = "",
}) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count;

  return <span className={`unread-badge ${className}`}>{displayCount}</span>;
};
