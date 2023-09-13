type Notification = {
  userId: number;
  chatId: number;
  isRoom: boolean;
  isRead: boolean;
  timestamp: Date;
};

export default Notification;