import React, { useState } from "react";
import { useBeta } from "../../context/BetaContext";
import Modal from "../ui/Modal";
import { Input, Button } from "../ui";
import { API_URL } from "../../config";

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
      if (
        err.response?.status === 401 ||
        err.message?.includes("unauthenticated") ||
        err.message?.includes("Not authenticated")
      ) {
        localStorage.setItem("open_beta_modal", "true");
        localStorage.setItem("beta_key_attempt", key);
        window.location.href = `${API_URL}/auth/google`;
        return;
      }
      setError(
        err.response?.data?.error || err.message || "Failed to redeem beta key"
      );
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <Button
      onClick={handleRedeem}
      disabled={loading || !key.trim()}
      variant="primary"
    >
      {loading ? "Validating..." : "Redeem"}
    </Button>
  );

  if (success) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title=""
        size="sm"
        showCloseButton={false}
        closeOnOverlayClick={false}
      >
        <div className="text-center">
          <h2 className="text-green-500 text-2xl font-bold mb-4">Success!</h2>
          <p className="text-gray-300">Beta access granted. Redirecting...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Echo Beta Access"
      size="sm"
      footer={footer}
    >
      <p className="text-center mb-6 text-gray-300">
        Enter your beta key for free access to Echo !
      </p>

      <Input
        type="text"
        placeholder="Enter beta key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleRedeem()}
        disabled={loading}
        autoFocus
      />

      {error && (
        <div className="feedback-message error mt-4">{error}</div>
      )}
    </Modal>
  );
};

export default BetaAccessModal;
