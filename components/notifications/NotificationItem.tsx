'use client';

import { getTimeAgo, type Notification } from '@/lib/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'achievement':
        return 'border-l-amber-500 bg-amber-500/5';
      case 'streak':
        return 'border-l-orange-500 bg-orange-500/5';
      case 'showcase_like':
        return 'border-l-pink-500 bg-pink-500/5';
      case 'system':
        return 'border-l-blue-500 bg-blue-500/5';
      default:
        return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative px-4 py-3 border-l-2 transition-colors cursor-pointer
        hover:bg-accent/50
        ${getTypeStyles()}
        ${!notification.read ? 'bg-accent/30' : ''}
      `}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
      )}
      
      {/* Title */}
      <h4 className={`text-sm font-medium leading-tight ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
        {notification.title}
      </h4>
      
      {/* Message */}
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
        {notification.message}
      </p>
      
      {/* Time */}
      <span className="text-[10px] text-muted-foreground/70 mt-1 block">
        {getTimeAgo(notification.created_at)}
      </span>
    </div>
  );
}
