import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ConfirmDialog {
  id: string;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    variant?: 'default' | 'danger'
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const notification: Notification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    },
    []
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText: string = 'Confirm',
      cancelText: string = 'Cancel',
      variant: 'default' | 'danger' = 'default'
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const dialog: ConfirmDialog = {
        id,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          setConfirmDialog(null);
        },
        onCancel: () => {
          if (onCancel) onCancel();
          setConfirmDialog(null);
        },
        confirmText,
        cancelText,
        variant,
      };

      setConfirmDialog(dialog);
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}
      <NotificationContainer notifications={notifications} />
      {confirmDialog && <ConfirmDialogComponent dialog={confirmDialog} />}
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      ))}
    </div>
  );
};

const ConfirmDialogComponent: React.FC<{ dialog: ConfirmDialog }> = ({ dialog }) => {
  return (
    <div className="confirm-dialog-overlay" onClick={dialog.onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3>{dialog.title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{dialog.message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn-secondary" onClick={dialog.onCancel}>
            {dialog.cancelText}
          </button>
          <button
            className={dialog.variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={dialog.onConfirm}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

