// ==============================================================================================
// 🔔 NOTIFICATION MODELS
// ==============================================================================================
// In-app notifications aur alert messages ke liye interfaces
// ==============================================================================================

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;          // e.g. 'TaskAssigned', 'StatusUpdated', 'CommentAdded'
  relatedTaskId?: number;// Related task ID deep link ke liye
  isRead: boolean;       // Padha gaya ya nahi
  createdAt: string;
}

// Backend se aane wala notifications list + total unread count ka wrapper
export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
