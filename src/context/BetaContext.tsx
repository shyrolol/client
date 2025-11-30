import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "./SocketContext";
import { API_URL } from "../config";

interface BetaContextType {
  isBetaAccess: boolean;
  betaExpiry: number | null;
  remainingMinutes: number;
  error: string | null;
  redeemBetaKey: (key: string) => Promise<boolean>;
}

const BetaContext = createContext<BetaContextType | undefined>(undefined);

export const BetaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBetaAccess, setIsBetaAccess] = useState(false);
  const [betaExpiry, setBetaExpiry] = useState<number | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const redeemBetaKey = async (key: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/redeem-beta-key`,
        { key },
        { withCredentials: true }
      );
      // server responds with { success: true, expiresAt }
      if (response.data && response.data.expiresAt) {
        const expires = new Date(response.data.expiresAt).getTime();
        setBetaExpiry(expires);
        setIsBetaAccess(true);
        setError(null);
        return true;
      }
      setError("Invalid response from server");
      return false;
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid beta key");
      return false;
    }
  };

  // Listen for beta expiry from server
  useEffect(() => {
    if (!socket) return;

    const handleBetaExpired = () => {
      // Mark beta as expired
      setIsBetaAccess(false);
      setBetaExpiry(null);
      setRemainingMinutes(0);

      // Reload page to show modal
      window.location.reload();
    };

    socket.on("beta_expired", handleBetaExpired);

    return () => {
      socket.off("beta_expired", handleBetaExpired);
    };
  }, [socket]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (betaExpiry && typeof betaExpiry === "number") {
        const now = Date.now();
        const remaining = Math.max(0, betaExpiry - now);
        const minutes = Math.ceil(remaining / (1000 * 60));
        setRemainingMinutes(minutes);

        if (remaining <= 0) {
          setIsBetaAccess(false);
          setBetaExpiry(null);
        }
      } else {
        setRemainingMinutes(0);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [betaExpiry]);

  return (
    <BetaContext.Provider
      value={{
        isBetaAccess,
        betaExpiry,
        remainingMinutes,
        error,
        redeemBetaKey,
      }}
    >
      {children}
    </BetaContext.Provider>
  );
};

export const useBeta = () => {
  const context = useContext(BetaContext);
  if (!context) throw new Error("useBeta must be used within BetaProvider");
  return context;
};
