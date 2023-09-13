import { createContext, useContext } from "react";
import Notification from "../types/notification";

type NotificationState = {
  notifications: Notification[];
  updateNotification: (chatId: number, isRoom: boolean) => void;
};

export const NotificationContext = createContext<NotificationState>({
  notifications: [],
  updateNotification: (_chatId: number, _isRoom: boolean) => {},
});

export default function useNotificationContext() {
  return useContext(NotificationContext);
};