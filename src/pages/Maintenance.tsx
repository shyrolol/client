import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const Maintenance: React.FC = () => {
  const [status, setStatus] = useState<{
    message?: string;
    estimatedTime?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = () => {
      fetch(`${API_URL}/system/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data.maintenance) {
            setStatus({
              message: data.message,
              estimatedTime: data.estimatedTime,
            });
          } else {
            window.location.href = "/";
          }
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div
      className="maintenance-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
        System Under Maintenance
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "var(--text-secondary)",
          maxWidth: "500px",
          marginBottom: "32px",
          lineHeight: "1.6",
        }}
      >
        {status?.message ||
          "We are currently performing scheduled maintenance to improve our services. Please check back later."}
      </p>

      {status?.estimatedTime && (
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--divider-subtle)",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Estimated completion:
          </span>
          <div
            style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "4px" }}
          >
            {status.estimatedTime}
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
