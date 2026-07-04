import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

import type { Notification } from "../types/notificationTypes";

const getTimeAgo = (date: string) => {
  const now = new Date();
  const created = new Date(date);

  const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diff < 60) return "Just now";

  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  if (diff < 172800) return "Yesterday";

  return created.toLocaleDateString();
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "Danger":
      return "#dc2626";
    case "Warning":
      return "#f59e0b";
    case "Success":
      return "#16a34a";
    default:
      return "#2563eb";
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "Danger":
      return "🔴";
    case "Warning":
      return "🟠";
    case "Success":
      return "🟢";
    default:
      return "🔵";
  }
};

function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load notifications");
    }
  };

  useEffect(() => {
    const loadInitialNotifications = async () => {
      await loadNotifications();
    };

    loadInitialNotifications();
  }, []);

  return (
    <AppLayout>
    <div
      style={{
        padding: "40px 30px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: "18px",
              fontSize: "48px",
              fontWeight: "700",
            }}
          >
            🔔 Notifications
          </h1>

          <p
            style={{
              color: "#666",
              margin: 0,
              fontSize: "16px",
            }}
          >
            Stay updated with your important financial events.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background: "#fff",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Dashboard
          </button>

          <button
            onClick={async () => {
              await markAllNotificationsAsRead();
              await loadNotifications();
            }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            marginTop: "120px",
            color: "#666",
          }}
        >
          <div style={{ fontSize: "70px" }}>🔔</div>
          <h2>You're all caught up!</h2>
          <p>No new notifications.</p>
        </div>
      ) : (
        notifications.map((notification) => {
          const color = getNotificationColor(notification.type);
          const icon = getNotificationIcon(notification.type);

          return (
            <div
              key={notification.id}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
              }}
              style={{
                borderLeft: `6px solid ${color}`,
                background: notification.isRead ? "#fafafa" : "#fffdf5",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.25s ease",
                cursor: "default",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  {icon} {notification.title}
                </h3>

                {!notification.isRead && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "white",
                      padding: "3px 10px",
                      borderRadius: "30px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>

              <p
                style={{
                  margin: "10px 0",
                  color: "#444",
                  fontSize: "16px",
                }}
              >
                {notification.message}
              </p>

              <p
                style={{
                  color: "#888",
                  fontSize: "13px",
                  marginTop: "10px",
                }}
              >
                {getTimeAgo(notification.createdAt)}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                {!notification.isRead && (
                  <button
                    onClick={async () => {
                      await markNotificationAsRead(notification.id);
                      await loadNotifications();
                    }}
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "7px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Mark Read
                  </button>
                )}

                <button
                  onClick={async () => {
                    await deleteNotification(notification.id);
                    await loadNotifications();
                  }}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
    </AppLayout>
  );
}

export default NotificationsPage;