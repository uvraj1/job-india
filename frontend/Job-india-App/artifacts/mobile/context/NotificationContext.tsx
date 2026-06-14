import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'job' | 'system' | 'premium';
  fullContent?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'time'>) => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New Job Matching Your Profile',
    body: 'A new Software Engineer role at Google has been posted. Apply now!',
    fullContent: 'Dear User,\n\nWe found a new job opening that perfectly matches your skills. Google is looking for a Senior Software Engineer for their Mountain View office.',
    time: '2 hours ago',
    read: false,
    type: 'job',
  },
  {
    id: '2',
    title: 'Profile View',
    body: 'A recruiter from Microsoft viewed your profile.',
    fullContent: 'Exciting news!\n\nA Talent Acquisition specialist from Microsoft has just viewed your professional profile.',
    time: '5 hours ago',
    read: true,
    type: 'system',
  },
  {
    id: '3',
    title: 'Welcome to Job India',
    body: 'Complete your profile to get 10x more visibility.',
    fullContent: 'Welcome to Job India - The world\'s leading job search platform.',
    time: '1 day ago',
    read: true,
    type: 'premium',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'time'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      time: 'Just now',
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
