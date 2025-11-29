import React, { useState } from "react";
import { useBeta } from "../context/BetaContext";

interface BetaAccessModalProps {
  onClose: () => void;
}

const BetaAccessModal: React.FC<BetaAccessModalProps> = ({ onClose }) => {
  const { redeemBetaKey } = useBeta();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRedeem = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError("");

    try {
      await redeemBetaKey(key);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      // Check if it's an authentication error
      if (
        err.response?.status === 401 ||
        err.message?.includes("unauthenticated") ||
        err.message?.includes("Not authenticated")
      ) {
        // Set flag in localStorage to reopen modal after login
        localStorage.setItem("open_beta_modal", "true");
        localStorage.setItem("beta_key_attempt", key);
        // Redirect to Google login
        window.location.href = "http://localhost:3001/auth/google";
        return;
      }
      setError(
        err.response?.data?.error || err.message || "Failed to redeem beta key"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beta-modal-overlay" onClick={onClose}>
      <div className="beta-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="beta-modal-close" onClick={onClose}>
          ×
        </button>

        {success ? (
          <div className="beta-success">
            <h2>Success!</h2>
            <p>Beta access granted. Redirecting...</p>
          </div>
        ) : (
          <>
            <h2>Echo Beta Access</h2>
            <p>Enter your beta key to get 6 hours of access</p>

            <div className="beta-form">
              <input
                type="text"
                placeholder="Enter beta key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRedeem()}
                disabled={loading}
                autoFocus
              />
              <button
                onClick={handleRedeem}
                disabled={loading || !key.trim()}
                className="beta-submit-btn"
              >
                {loading ? "Validating..." : "Redeem"}
              </button>
            </div>

            {error && <div className="beta-error">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default BetaAccessModal;
