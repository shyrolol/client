import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { BASE_URL } from "../config";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {

    });

    newSocket.on("connect_error", () => {

    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleUserUpdated = (updatedUser: any) => {
      if (updatedUser.id === user.id) {
        setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
      }
    };

    socket.on("user_updated", handleUserUpdated);

    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket, user, setUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
