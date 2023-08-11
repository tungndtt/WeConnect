import {
  ReactNode,
  createContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";

interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
}

interface Notification {
  userId: number;
  chatId: number;
  isRoom: boolean;
  isRead: boolean;
  timestamp: Date;
}

interface UserAccessRequest {
  chatGroupId: number;
  timestamp: Date;
}

interface Message {
  userId: number;
  message: string;
  timestamp: Date;
}

interface Chat {
  until?: Date;
  messages: Message[] | undefined;
  pendingMessages: string[];
}

interface ChatGroup extends Chat {
  name: string;
  ownerId: number;
}

interface ChatRoom extends Chat {
  chatRoomId: number;
}

interface AppState {
  profile: User | undefined;
  users: Map<number, User>;
  notifications: Notification[] | undefined;
  userAccessRequests: UserAccessRequest[] | undefined;
  chatGroups: Map<number, ChatGroup>;
  chatRooms: Map<number, ChatRoom>;
  chatBot: Chat;

  updateProfile: (update: User) => Promise<any>;
  updateNotification: (chatId: number, isRoom: boolean) => Promise<any>;
  registerChatGroup: (groupName: string) => Promise<any>;
  updateChatGroup: (newGroupName?: string, newOwnerId?: number) => Promise<any>;
  getChatGroupAccessRequests: (chatGroupId: number) => Promise<any>;
  registerChatGroupAccessRequest: (chatGroupId: number) => Promise<any>;
  reviewChatGroupAccessRequest: (
    chatGroupId: number,
    requesterId: number
  ) => Promise<any>;
  getGroupChatMessages: (
    chatGroupId: number,
    pastScrolling: boolean
  ) => Promise<any>;
  getRoomChatMessages: (
    chatRoomId: number,
    pastScrolling: boolean
  ) => Promise<any>;
  getBotChatMessages: (pastScrolling: boolean) => Promise<any>;
  sendMessage: (message: SocketMessage) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  signUp: (information: User) => Promise<any>;
}

interface SocketMessage {
  chatType: "group" | "room" | "bot";
  message: string;
  other_user_id?: number;
  chat_group_id?: number;
}

export const AppStateContext = createContext<AppState>({
  profile: undefined,
  users: new Map<number, User>(),
  notifications: undefined,
  userAccessRequests: undefined,
  chatGroups: new Map<number, ChatGroup>(),
  chatRooms: new Map<number, ChatRoom>(),
  chatBot: {
    until: undefined,
    messages: undefined,
    pendingMessages: [] as string[],
  },

  updateProfile: (_update: User) => new Promise<any>(() => {}),
  updateNotification: (_userId: number) => new Promise<any>(() => {}),
  registerChatGroup: (_groupName: string) => new Promise<any>(() => {}),
  updateChatGroup: (_newGroupName?: string, _newOwnerId?: number) =>
    new Promise<any>(() => {}),
  getChatGroupAccessRequests: (_chatGroupId: number) =>
    new Promise<any>(() => {}),
  registerChatGroupAccessRequest: (_chatGroupId: number) =>
    new Promise<any>(() => {}),
  reviewChatGroupAccessRequest: (_chatGroupId: number, _requesterId: number) =>
    new Promise<any>(() => {}),
  getGroupChatMessages: (_chatGroupId: number, _pastScrolling: boolean) =>
    new Promise<any>(() => {}),
  getRoomChatMessages: (_chatRoomId: number, _pastScrolling: boolean) =>
    new Promise<any>(() => {}),
  getBotChatMessages: (_pastScrolling: boolean) => new Promise<any>(() => {}),
  sendMessage: (_message: SocketMessage) => {},
  signIn: (_email: string, _password: string) => new Promise<any>(() => {}),
  signOut: () => new Promise<any>(() => {}),
  signUp: (_information: User) => new Promise<any>(() => {}),
});

const HOST = "127.0.0.1";
const PORT = 2204;

export function AppStateProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const socketConnection = useRef(undefined as WebSocket | undefined);

  const [profile, setProfile] = useState(undefined as User | undefined);
  const [users, setUsers] = useState(new Map<number, User>());
  const [notifications, setNotifications] = useState(
    undefined as Notification[] | undefined
  );
  const [userAccessRequests, setUserAccessRequests] = useState(
    undefined as UserAccessRequest[] | undefined
  );

  const [chatGroups, setChatGroups] = useState(new Map<number, ChatGroup>());
  const [chatRooms, setChatRooms] = useState(new Map<number, ChatRoom>());
  const [chatBot, setChatBot] = useState({
    until: undefined,
    messages: undefined,
    pendingMessages: [] as string[],
  });

  const sendRequest = (
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    payload: any | undefined,
    onSucess: (response: any) => void,
    onFail: (response: any) => void
  ) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status < 400) onSucess(this.response);
        else onFail(this.response);
      }
    };
    xhttp.open(method, `http://${HOST}:${PORT}/http/${endpoint}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader("Authorization", token);
    if (payload) xhttp.send(JSON.stringify(payload));
  };

  useEffect(() => {
    if (token) {
      const botChatTimestamp = new Date(
        sessionStorage.get("botchat_timestamp")
      );
      const roomChatTimestamps = new Map<number, Date>();
      const groupChatTimestamps = new Map<number, Date>();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) as string;
        const timestamp = sessionStorage.getItem(key) as string;
        if (key.startsWith("roomchat_timestamp-")) {
          const roomId = Number(key.substring("roomchat_timestamp-".length));
          roomChatTimestamps.set(roomId, new Date(timestamp));
        } else if (key.startsWith("groupchat_timestamp-")) {
          const groupId = Number(key.substring("groupchat_timestamp-".length));
          groupChatTimestamps.set(groupId, new Date(timestamp));
        }
      }

      socketConnection.current = new WebSocket(`ws://${HOST}:${PORT}/socket`);
      socketConnection.current?.addEventListener("open", () => {
        console.log("Connected to server");
        socketConnection.current?.send(JSON.stringify({ token: token }));
      });
      socketConnection.current?.addEventListener("close", () => {
        console.log("Disconnected to server");
        socketConnection.current?.close();
        setToken("");
      });

      Promise.all(
        [
          "users/profile",
          "users",
          "notifications",
          "users/access_requests",
          "chat_groups",
          "chat_rooms",
        ].map(
          (endpoint: string) =>
            new Promise<any>((resolve, reject) =>
              sendRequest("GET", endpoint, undefined, resolve, reject)
            )
        )
      ).then(
        ([
          fprofile,
          fusers,
          fnotifications,
          fUserAcessRequests,
          fchatGroups,
          fchatRooms,
        ]) => {
          setProfile({
            id: fprofile[0],
            firstName: fprofile[1],
            lastName: fprofile[2],
            email: fprofile[3],
            password: fprofile[4],
          });
          setUsers(
            new Map(
              (fusers as any[]).map((fuser: any) => [
                fuser[0],
                {
                  firstName: fuser[0],
                  lastName: fuser[1],
                },
              ])
            )
          );
          setNotifications(
            (fnotifications as any[]).map((fnotification: any) => ({
              userId: fnotification[0],
              chatId: fnotification[1],
              isRoom: fnotification[2],
              isRead: fnotification[3],
              timestamp: new Date(fnotification[4]),
            }))
          );
          setUserAccessRequests(
            (fUserAcessRequests as any[]).map((fUserAcessRequest: any) => ({
              chatGroupId: fUserAcessRequest[0],
              timestamp: fUserAcessRequest[1],
            }))
          );
          setChatGroups(
            new Map(
              (fchatGroups as any[]).map((fchatGroup: any) => [
                fchatGroup[0],
                {
                  name: fchatGroup[1],
                  ownerId: fchatGroup[2],
                  until: groupChatTimestamps.get(fchatGroup[0]),
                  messages: undefined,
                  pendingMessages: [],
                },
              ])
            )
          );
          setChatRooms(
            new Map(
              (fchatRooms as any[]).map((fchatRoom: any) => [
                fchatRoom[1],
                {
                  chatRoomId: fchatRoom[0],
                  until: roomChatTimestamps.get(fchatRoom[0]),
                  messages: undefined,
                  pendingMessages: [],
                },
              ])
            )
          );
        }
      );
    } else {
      socketConnection.current = undefined;
    }
  }, [token]);

  const appState: AppState = useMemo(() => {
    const handleIncomingMessageHumanChat = (
      chat: Chat,
      chatId: number,
      isRoom: boolean,
      data: any
    ) => {
      const { user_id, message, timestamp } = data;
      const messageTimestamp = new Date(timestamp);
      if (message) {
        if (!chat.messages) {
          chat.messages = [];
          chat.until = messageTimestamp;
        }
        chat.messages.push({
          userId: user_id,
          message: message,
          timestamp: messageTimestamp,
        });
      }
      if (profile!.id === user_id) {
        chat.pendingMessages.splice(0, 1);
        let isChatInNoti = false;
        for (let notification of notifications!) {
          if (
            notification.isRoom === isRoom &&
            notification.chatId === chatId
          ) {
            notification.isRead = false;
            isChatInNoti = true;
            break;
          }
        }
        if (!isChatInNoti) {
          notifications!.push({
            userId: user_id,
            chatId: chatId,
            isRoom: isRoom,
            isRead: false,
            timestamp: messageTimestamp,
          });
        }
        setNotifications([...notifications!]);
      }
      return !message;
    };

    socketConnection.current?.addEventListener("message", (event) => {
      const type = event.data["type"];
      switch (type) {
        case "user_activity": {
          break;
        }
        case "user_update": {
          break;
        }
        case "group_chat_update": {
          break;
        }
        case "group_chat_message": {
          const { chat_group_id } = event.data;
          const chatGroup = chatGroups.get(chat_group_id)!;
          if (
            handleIncomingMessageHumanChat(
              chatGroup,
              chat_group_id,
              false,
              event.data
            )
          ) {
            setChatGroups(new Map(chatGroups));
          }
          break;
        }
        case "room_chat_message": {
          const { user_id, other_user_id, chat_room_id } = event.data;
          const otherUserId = profile!.id === user_id ? other_user_id : user_id;
          const chatRoom = chatRooms.get(otherUserId)!;
          chatRoom.chatRoomId =
            chatRoom.chatRoomId === 0 ? chat_room_id : chatRoom.chatRoomId;
          if (
            handleIncomingMessageHumanChat(
              chatRoom,
              chat_room_id,
              true,
              event.data
            )
          ) {
            setChatRooms(new Map(chatRooms));
          }
          break;
        }
        case "bot_chat_message": {
          break;
        }
      }
    });
    return {
      profile,
      users,
      notifications,
      userAccessRequests,
      chatGroups,
      chatRooms,
      chatBot,

      updateProfile: (update: User) => new Promise<any>(() => {}),
      updateNotification: (userId: number) => new Promise<any>(() => {}),
      registerChatGroup: (groupName: string) => new Promise<any>(() => {}),
      updateChatGroup: (newGroupName?: string, newOwnerId?: number) =>
        new Promise<any>(() => {}),
      getChatGroupAccessRequests: (chatGroupId: number) =>
        new Promise<any>(() => {}),
      registerChatGroupAccessRequest: (chatGroupId: number) =>
        new Promise<any>(() => {}),
      reviewChatGroupAccessRequest: (
        chatGroupId: number,
        requesterId: number
      ) => new Promise<any>(() => {}),
      getGroupChatMessages: (chatGroupId: number, pastScrolling: boolean) =>
        new Promise<any>(() => {}),
      getRoomChatMessages: (chatRoomId: number, pastScrolling: boolean) =>
        new Promise<any>(() => {}),
      getBotChatMessages: (pastScrolling: boolean) =>
        new Promise<any>(() => {}),
      sendMessage: (socketMessage: SocketMessage) => {
        if (token && socketMessage.message) {
          socketConnection.current?.send(
            JSON.stringify({ ...socketMessage, token: token })
          );
          switch (socketMessage.chatType) {
            case "group": {
              const chatGroup = chatGroups.get(socketMessage.chat_group_id!)!;
              chatGroup.pendingMessages.push(socketMessage.message);
              setChatGroups(new Map(chatGroups));
              break;
            }
            case "room": {
              let chatRoom = chatRooms.get(socketMessage.other_user_id!);
              if (!chatRoom) {
                chatRoom = {
                  chatRoomId: 0,
                  messages: undefined,
                  until: undefined,
                  pendingMessages: [],
                };
                chatRooms.set(socketMessage.other_user_id!, chatRoom);
              }
              chatRoom.pendingMessages.push(socketMessage.message);
              setChatRooms(new Map(chatRooms));
              break;
            }
            default: {
              chatBot.pendingMessages.push(socketMessage.message);
              setChatBot({ ...chatBot });
            }
          }
        }
      },
      signIn: (email: string, password: string) =>
        new Promise<any>((resolve, reject) =>
          sendRequest(
            "POST",
            "login",
            { email, password },
            (response: any) => {
              setToken(response["token"]);
              resolve(response);
            },
            reject
          )
        ),
      signOut: () =>
        new Promise<any>((resolve, reject) =>
          sendRequest(
            "GET",
            "logout",
            undefined,
            (response: any) => {
              setToken("");
              resolve(response);
            },
            reject
          )
        ),
      signUp: (information: User) =>
        new Promise<any>((resolve, reject) =>
          sendRequest(
            "POST",
            "register",
            {
              email: information.email,
              password: information.password,
              first_name: information.firstName,
              last_name: information.lastName,
            },
            (response: any) => {
              setToken("");
              resolve(response);
            },
            reject
          )
        ),
    };
  }, [
    profile,
    users,
    notifications,
    userAccessRequests,
    chatGroups,
    chatRooms,
    chatBot,
  ]);

  return (
    <AppStateContext.Provider value={appState}>
      {props.children}
    </AppStateContext.Provider>
  );
}
