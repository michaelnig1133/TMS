import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../utilities/endpoints';

const NotificationContext = createContext();

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(ENDPOINTS.REQUEST_NOTIFICATIONS, { 
        params: { unread_only: false },
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setNotifications(response.data.results);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(ENDPOINTS.UNREADOUNT, { 
        params: { user_id: userId },
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(ENDPOINTS.MARKALL_READ, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setUnreadCount(0);
      // Update all notifications to is_read: true
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotifications,
        fetchNotifications,
        fetchUnreadCount,
        markAllAsRead,
        removeNotification,
        toggleNotifications,
        setShowNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};