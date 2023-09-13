import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../contextes/app-context";
import useProfileContext from "../contextes/profile-context";
import { NotificationContext } from "../contextes/notification-context";
import { addSocketMessageHandler } from "../lib/api/socket";
import Notification from "../types/notification";

export default function NotificationProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const { profile } = useProfileContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const updateNotification = (chatId: number, isRoom: boolean) => {
    sendRequest("notifications", "PUT", {
      chat_id: chatId,
      is_room: isRoom,
    }).then(() => {
      setNotifications((_notifications) =>
        notifications.map((_notification) => {
          if (
            _notification.isRoom === isRoom &&
            _notification.chatId === chatId &&
            !_notification.isRead
          ) {
            _notification.isRead = true;
          }
          return _notification;
        })
      );
    });
  };

  const updateNotifications = (chatId: number, isRoom: boolean, data: any) => {
    const { user_id, timestamp } = data;
    if (profile!.id === user_id) {
      setNotifications((_notifications: Notification[]) => {
        let isChatInNotifications = false;
        for (let _notification of _notifications!) {
          if (
            _notification.isRoom === isRoom &&
            _notification.chatId === chatId
          ) {
            _notification.isRead = false;
            isChatInNotifications = true;
            break;
          }
        }
        if (!isChatInNotifications) {
          _notifications!.push({
            userId: user_id,
            chatId: chatId,
            isRoom: isRoom,
            isRead: false,
            timestamp: new Date(timestamp),
          });
        }
        return [..._notifications!];
      });
    }
  };

  useEffect(() => {
    if (token) {
      addSocketMessageHandler("group_chat_message", (data) => {
        updateNotifications(data.chat_group_id, false, data);
      });
      addSocketMessageHandler("room_chat_message", (data) => {
        updateNotifications(data.chat_room_id, true, data);
      });
      addSocketMessageHandler("unregister_access_request", (data) => {
        if (data.is_leave) {
          setNotifications((_notifications: Notification[]) => {
            const index = _notifications!.findIndex(
              (notification: Notification) =>
                !notification.isRoom &&
                notification.chatId === data.chat_group_id
            );
            _notifications!.splice(index, 1);
            return [..._notifications];
          });
        }
      });
      sendRequest("notifications", "GET").then((_notifications) =>
        setNotifications(
          (_notifications as any[]).map((_notification: any) => ({
            userId: _notification[0],
            chatId: _notification[1],
            isRoom: _notification[2],
            isRead: _notification[3],
            timestamp: new Date(_notification[4]),
          }))
        )
      );
    }
  }, [token]);

  return (
    <NotificationContext.Provider value={{ notifications, updateNotification }}>
      {props.children}
    </NotificationContext.Provider>
  );
}
