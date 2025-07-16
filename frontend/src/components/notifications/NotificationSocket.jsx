import React, { useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { Toast, ToastContainer } from "react-bootstrap";
import { WEBSOCKET_API_URL } from "../api_route/api";
export default function NotificationSocket() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      console.warn("Access token not found in cookies.");
      return;
    }

    const ws = new WebSocket(
      `${WEBSOCKET_API_URL}/ws/notifications?token=${accessToken}`
    );

    ws.onopen = () => {
      
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setNotifications((prev) => [data, ...prev.slice(0, 9)]); 
    };

    ws.onclose = () => {
      
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <ToastContainer position="top-end" className="p-3">
      {notifications.map((notify, idx) => (
        <Toast
          key={idx}
          bg="info"
          onClose={() =>
            setNotifications((prev) => prev.filter((_, i) => i !== idx))
          }
          delay={5000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">
              {notify.event.replace("_", " ").toUpperCase()}
            </strong>
            <small>Now</small>
          </Toast.Header>
          <Toast.Body className="text-white">{notify.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
