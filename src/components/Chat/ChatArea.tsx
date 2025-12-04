import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Upload } from "lucide-react";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

interface ChatAreaProps {
  socket: Socket;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  senderAvatar?: string;
  image?: string;
  timestamp: number;
}

const ChatArea: React.FC<ChatAreaProps> = ({ socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_typing", (data: { user: string }) => {
      setTypingUser(data.user);
      setTimeout(() => setTypingUser(null), 3000);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: input,
      sender: socket.id || "Anonymous",
      senderName: user?.displayName ?? undefined,
      senderAvatar: user?.avatar ?? undefined,
      timestamp: Date.now(),
    };

    socket.emit("send_message", message);
    setInput("");
  };

  const handleTyping = () => {
    socket.emit("typing", { user: socket.id });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const message: Message = {
        id: Date.now().toString(),
        text: "",
        sender: socket.id || "Anonymous",
        senderName: user?.displayName ?? undefined,
        senderAvatar: user?.avatar ?? undefined,
        image: data.url,
        timestamp: Date.now(),
      };
      socket.emit("send_message", message);
    } catch (error) {

    }
  };

  return (
    <div className="chat-area-container">
      <div className="chat-messages-list">
        {messages.map((msg) => {
          const isOwn = msg.sender === socket.id;
          const author =
            msg.senderName ?? (isOwn ? user?.displayName ?? "You" : "Unknown");
          return (
            <div key={msg.id} className={`chat-message ${isOwn ? "own" : ""}`}>
              {msg.senderAvatar && (
                <img
                  src={msg.senderAvatar}
                  alt={author}
                  className="chat-message-avatar"
                />
              )}
              <div className="chat-message-body">
                <div className="chat-message-author">{author}</div>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="uploaded"
                    className="chat-message-image"
                  />
                )}
                {msg.text && (
                  <div className="chat-message-text">{msg.text}</div>
                )}
                <div className="chat-message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingUser && (
        <div className="chat-typing-indicator">{typingUser} is typing...</div>
      )}

      <div className="message-input-container">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          style={{ display: "none" }}
          onChange={handleFileUpload}
          accept="image/*"
        />
        <div className="message-input-wrapper">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="file-upload-btn"
            aria-label="Upload image"
          >
            <Upload size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="message-input"
          />
          <button
            onClick={sendMessage}
            className="chat-send-btn"
            style={{ display: "none" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
