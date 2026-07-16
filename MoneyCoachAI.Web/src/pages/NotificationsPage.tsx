import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../components/AppLayout";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

import type { Notification } from "../types/notificationTypes";

import "../styles/pageLayout.css";

const getTimeAgo = (date: string) => {
  const now = new Date();
  const created = new Date(date);

  const differenceInSeconds = Math.floor(
    (now.getTime() - created.getTime()) / 1000
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  if (differenceInSeconds < 3600) {
    const minutes = Math.floor(differenceInSeconds / 60);

    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  if (differenceInSeconds < 86400) {
    const hours = Math.floor(differenceInSeconds / 3600);

    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  if (differenceInSeconds < 172800) {
    return "Yesterday";
  }

  return created.toLocaleDateString();
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "Danger":
      return "#FF6467";

    case "Warning":
      return "#FFB547";

    case "Success":
      return "#21C77A";

    default:
      return "#4F7CFF";
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "Danger":
      return "🚨";

    case "Warning":
      return "⚠️";

    case "Success":
      return "✅";

    default:
      return "🔔";
  }
};

function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      alert("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    const loadInitialNotifications = async () => {
      await loadNotifications();
    };

    loadInitialNotifications();
  }, []);



  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);

      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      alert("Failed to mark all notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      setActionLoadingId(notificationId);

      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      alert("Failed to mark notification as read");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setActionLoadingId(notificationId);

      await deleteNotification(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <AppLayout>
      <style>
        {`
          .notifications-page {
            min-width: 0;
          }

          .notifications-summary {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            color: var(--mca-muted);
            font-size: 14px;
            font-weight: 700;
          }

          .notifications-count {
            min-width: 28px;
            height: 28px;
            padding: 0 9px;

            display: inline-grid;
            place-items: center;

            border-radius: 999px;

            color: #6C4DFF;
            background: rgba(124, 92, 252, 0.12);
          }

          .notification-secondary-button {
            padding: 12px 18px;

            border: 1px solid rgba(79, 124, 255, 0.4);
            border-radius: 16px;

            color: var(--mca-primary);
            background: rgba(255, 255, 255, 0.58);

            font-weight: 800;
            cursor: pointer;

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.9),
              0 8px 18px rgba(49, 66, 104, 0.06);
          }

          .notification-secondary-button:hover {
            background: rgba(255, 255, 255, 0.8);
          }

          .notifications-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .notification-card {
            position: relative;

            width: 100%;
            min-width: 0;

            padding: 20px;

            border: 1px solid rgba(255, 255, 255, 0.72);
            border-radius: 22px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.8),
                rgba(248, 250, 255, 0.66)
              );

            box-shadow:
              0 12px 30px rgba(49, 66, 104, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.92);

            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease;
          }

          .notification-card:hover {
            transform: translateY(-2px);

            box-shadow:
              0 16px 35px rgba(49, 66, 104, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }

          .notification-card.unread {
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.9),
                rgba(245, 243, 255, 0.74)
              );
          }

          .notification-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
          }

          .notification-heading {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            min-width: 0;
          }

          .notification-icon {
            width: 44px;
            height: 44px;

            flex-shrink: 0;

            display: grid;
            place-items: center;

            border-radius: 15px;

            font-size: 20px;

            background: rgba(255, 255, 255, 0.7);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 18px rgba(49, 66, 104, 0.07);
          }

          .notification-title {
            margin: 2px 0 0;

            color: #111827;

            font-size: 17px;
            font-weight: 900;
            line-height: 1.35;

            overflow-wrap: anywhere;
          }

          .notification-new-badge {
            flex-shrink: 0;

            padding: 5px 10px;

            border-radius: 999px;

            color: #ffffff;
            background: linear-gradient(135deg, #FF6467, #FF4D57);

            font-size: 11px;
            font-weight: 900;
          }

          .notification-message {
            margin: 14px 0 0 56px;

            color: #465064;

            font-size: 15px;
            line-height: 1.65;

            overflow-wrap: anywhere;
          }

          .notification-time {
            margin: 10px 0 0 56px;

            color: var(--mca-muted);

            font-size: 12px;
            font-weight: 700;
          }

          .notification-card-actions {
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 10px;

            margin-top: 16px;
          }

          .notification-action-button {
            padding: 9px 14px;

            border: none;
            border-radius: 13px;

            color: #ffffff;

            font-size: 13px;
            font-weight: 800;

            cursor: pointer;
          }

          .notification-action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .notification-read-button {
            background: linear-gradient(135deg, #21C77A, #16A764);
          }

          .notification-delete-button {
            background: linear-gradient(135deg, #FF6467, #E5444A);
          }

          .notifications-empty-state {
            min-height: 420px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 36px 20px;

            text-align: center;
          }

          .notifications-empty-icon {
            width: 92px;
            height: 92px;

            display: grid;
            place-items: center;

            border-radius: 30px;

            font-size: 45px;

            background:
              radial-gradient(
                circle,
                rgba(91, 140, 255, 0.18),
                rgba(124, 92, 252, 0.1)
              );

            animation: notificationFloat 3s ease-in-out infinite;
          }

          .notifications-empty-state h2 {
            margin: 22px 0 8px;

            color: #111827;

            font-size: 28px;
            font-weight: 900;
          }

          .notifications-empty-state p {
            margin: 0;

            color: var(--mca-muted);

            font-size: 15px;
          }

          .notifications-loading {
            min-height: 320px;

            display: grid;
            place-items: center;

            color: var(--mca-muted);

            font-size: 16px;
            font-weight: 800;
          }

          @keyframes notificationFloat {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-7px);
            }
          }

          @media (max-width: 760px) {
            .notification-card {
              padding: 16px;
              border-radius: 18px;
            }

            .notification-card-header {
              flex-wrap: wrap;
            }

            .notification-heading {
              width: calc(100% - 58px);
            }

            .notification-message,
            .notification-time {
              margin-left: 0;
            }

            .notification-card-actions {
              justify-content: stretch;
            }

            .notification-card-actions button {
              flex: 1;
              min-width: 110px;
            }

            .notifications-empty-state {
              min-height: 330px;
            }
          }

          @media (max-width: 480px) {
            .notification-heading {
              width: 100%;
            }

            .notification-new-badge {
              margin-left: 56px;
            }

            .notification-icon {
              width: 40px;
              height: 40px;
            }

            .notification-title {
              font-size: 16px;
            }

            .notification-message {
              font-size: 14px;
            }

            .notification-card-actions {
              flex-direction: column;
            }

            .notification-card-actions button {
              width: 100%;
              flex: none;
            }
          }
        `}
      </style>

      <div className="mca-page notifications-page">
        <header className="mca-page-header">
          <div>
            <h1 className="mca-page-title">🔔 Notifications</h1>

            <p className="mca-page-subtitle">
              Stay updated with your important financial events.
            </p>

            <div className="notifications-summary">
              <span className="notifications-count">{unreadCount}</span>

              <span>
                {unreadCount === 1
                  ? "Unread notification"
                  : "Unread notifications"}
              </span>
            </div>
          </div>

          <div className="mca-page-actions">
            <button
              type="button"
              className="notification-secondary-button"
              onClick={() => navigate("/dashboard")}
            >
              ← Dashboard
            </button>

            <button
              type="button"
              className="mca-gradient-button"
              disabled={markingAllRead || unreadCount === 0}
              onClick={handleMarkAllRead}
            >
              {markingAllRead ? "Updating..." : "Mark All Read"}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="mca-glass-card notifications-loading">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="mca-glass-card notifications-empty-state">
            <div className="notifications-empty-icon">🔔</div>

            <h2>You&apos;re all caught up!</h2>

            <p>No new notifications are available.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const notificationColor = getNotificationColor(
                notification.type
              );

              const notificationIcon = getNotificationIcon(
                notification.type
              );

              const actionLoading =
                actionLoadingId === notification.id;

              return (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    notification.isRead ? "" : "unread"
                  }`}
                  style={{
                    borderLeft: `5px solid ${notificationColor}`,
                  }}
                >
                  <div className="notification-card-header">
                    <div className="notification-heading">
                      <div className="notification-icon">
                        {notificationIcon}
                      </div>

                      <h2 className="notification-title">
                        {notification.title}
                      </h2>
                    </div>

                    {!notification.isRead && (
                      <span className="notification-new-badge">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="notification-message">
                    {notification.message}
                  </p>

                  <p className="notification-time">
                    {getTimeAgo(notification.createdAt)}
                  </p>

                  <div className="notification-card-actions">
                    {!notification.isRead && (
                      <button
                        type="button"
                        className="
                          notification-action-button
                          notification-read-button
                        "
                        disabled={actionLoading}
                        onClick={() =>
                          handleMarkRead(notification.id)
                        }
                      >
                        {actionLoading ? "Updating..." : "Mark Read"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="
                        notification-action-button
                        notification-delete-button
                      "
                      disabled={actionLoading}
                      onClick={() =>
                        handleDeleteNotification(notification.id)
                      }
                    >
                      {actionLoading ? "Please wait..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;