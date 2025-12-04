export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { icon: '/vite.svg', ...options });
  }
};

export const showMessageNotification = (message: {
  user: { displayName: string; avatar?: string };
  content: string;
  channelName?: string;
}) => {
  const title = message.channelName
    ? `#${message.channelName} - ${message.user.displayName}`
    : message.user.displayName;

  showNotification(title, {
    body: message.content,
    icon: message.user.avatar || '/vite.svg',
    tag: 'message',
  });
};

export const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => { });
};
