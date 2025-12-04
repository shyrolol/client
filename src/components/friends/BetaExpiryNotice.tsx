import React, { useEffect, useState } from "react";
import { useBeta } from "../../context/BetaContext";
import { Clock, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui";

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
      <Modal
        isOpen={true}
        onClose={() => setShowExpired(false)}
        title="Thank you for trying Echo Beta!"
        size="sm"
        showCloseButton={true}
      >
        <div className="text-center">
          <p className="mb-6 text-gray-300">
            Your 6-hour beta access has ended. We hope you enjoyed it!
          </p>

          <div className="mb-6">
            <Button
              variant="primary"
              onClick={() => window.open("https://forms.gle/qYNTkKk5gXQBcPkq8", "_blank")}
              className="w-full"
            >
              <ExternalLink size={16} className="mr-2" />
              Send Feedback
            </Button>
          </div>

          <p className="text-sm text-gray-400">
            Want more access? Join our community or wait for the next beta wave.
          </p>
        </div>
      </Modal>
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
