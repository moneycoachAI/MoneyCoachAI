import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUnreadNotifications } from "../services/notificationService";
import type { Notification } from "../types/notificationTypes";

function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadNotifications = async () => {
      try {
        const data: Notification[] = await getUnreadNotifications();
        setUnreadCount(data.length);
      } catch (error) {
        console.error("Failed to load unread notifications", error);
      }
    };

    loadUnreadNotifications();
  }, []);

  return (
    <button
        onClick={() => navigate("/notifications")}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
        }}
        style={{
            position: "relative",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontSize: "24px",
            transition: "background-color 0.2s ease",
        }}
        >
        🔔

        {unreadCount > 0 && (
            <span
            style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "red",
                color: "white",
                borderRadius: "50%",
                minWidth: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
            }}
            >
            {unreadCount}
            </span>
        )}
    </button>
  );
  
}

export default NotificationBell;