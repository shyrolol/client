import React, { useEffect, useState } from "react";
import { useBeta } from "../../context/BetaContext";
import { Clock, ExternalLink } from "lucide-react";

const BetaExpiryNotice: React.FC = () => {
  const { isBetaAccess, remainingMinutes } = useBeta();
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    if (isBetaAccess && remainingMinutes === 0) {
      setShowExpired(true);
    }
  }, [isBetaAccess, remainingMinutes]);

  if (showExpired) {
    return (
      <div className="beta-expiry-modal-overlay">
        <div className="beta-expiry-modal">
          <h2>Thank you for trying Echo Beta!</h2>
          <p>Your 6-hour beta access has ended. We hope you enjoyed it!</p>

          <div className="beta-expiry-actions">
            <a
              href="https://forms.gle/qYNTkKk5gXQBcPkq8"
              target="_blank"
              rel="noopener noreferrer"
              className="beta-feedback-btn"
            >
              <ExternalLink size={16} />
              Send Feedback
            </a>
          </div>

          <p className="beta-expiry-note">
            Want more access? Join our community or wait for the next beta wave.
          </p>
        </div>
      </div>
    );
  }

  if (isBetaAccess && remainingMinutes > 0 && remainingMinutes <= 60) {
    return (
      <div className="beta-expiry-banner">
        <Clock size={16} />
        <span>
          Beta access expires in {remainingMinutes} minute
          {remainingMinutes !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  return null;
};

export default BetaExpiryNotice;
