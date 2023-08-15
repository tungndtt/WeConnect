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
  isOnline?: boolean;
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
  pendingMessages: [number, string][];
}

interface ChatGroup extends Chat {
  name: string;
  ownerId: number;
}

interface ChatRoom extends Chat {
  chatRoomId: number;
}

interface AppState {
  token: string;
  profile: User | undefined;
  users: Map<number, User>;
  notifications: Notification[] | undefined;
  userAccessRequests: UserAccessRequest[] | undefined;
  chatGroups: Map<number, ChatGroup>;
  chatRooms: Map<number, ChatRoom>;
  chatBot: Chat;

  updateProfile: (update: User) => Promise<void>;
  updateNotification: (chatId: number, isRoom: boolean) => Promise<void>;
  registerChatGroup: (groupName: string) => Promise<void>;
  updateChatGroup: (
    newGroupName?: string,
    newOwnerId?: number
  ) => Promise<void>;
  registerChatGroupAccessRequest: (chatGroupId: number) => Promise<void>;
  reviewChatGroupAccessRequest: (
    chatGroupId: number,
    requesterId: number,
    acess: boolean
  ) => Promise<void>;
  getGroupChatMessages: (chatGroupId: number, before: boolean) => Promise<void>;
  getRoomChatMessages: (chatRoomId: number, before: boolean) => Promise<void>;
  getBotChatMessages: (before: boolean) => Promise<void>;
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
  token: "",
  profile: undefined,
  users: new Map<number, User>(),
  notifications: undefined,
  userAccessRequests: undefined,
  chatGroups: new Map<number, ChatGroup>(),
  chatRooms: new Map<number, ChatRoom>(),
  chatBot: {
    until: undefined,
    messages: undefined,
    pendingMessages: [] as [number, string][],
  },

  updateProfile: (_update: User) => new Promise<void>(() => {}),
  updateNotification: (_chatId: number, _isRoom: boolean) =>
    new Promise<void>(() => {}),
  registerChatGroup: (_groupName: string) => new Promise<void>(() => {}),
  updateChatGroup: (_newGroupName?: string, _newOwnerId?: number) =>
    new Promise<void>(() => {}),
  registerChatGroupAccessRequest: (_chatGroupId: number) =>
    new Promise<void>(() => {}),
  reviewChatGroupAccessRequest: (
    _chatGroupId: number,
    _requesterId: number,
    _access: boolean
  ) => new Promise<any>(() => {}),
  getGroupChatMessages: (_chatGroupId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  getRoomChatMessages: (_chatRoomId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  getBotChatMessages: (_before: boolean) => new Promise<void>(() => {}),
  sendMessage: (_message: SocketMessage) => {},
  signIn: (_email: string, _password: string) => new Promise<any>(() => {}),
  signOut: () => new Promise<any>(() => {}),
  signUp: (_information: User) => new Promise<any>(() => {}),
});

const HOST = "127.0.0.1";
const PORT = 2204;

export function AppStateProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState(sessionStorage.getItem("token") || "");
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
    pendingMessages: [],
  } as Chat);

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
        if (this.status < 400) {
          const { status, data } = this.response;
          if (status) onSucess(data);
          else onFail(data);
        } else {
          setToken("");
        }
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
      setChatBot({
        until: botChatTimestamp,
        messages: undefined,
        pendingMessages: [],
      });
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
          const musers = new Map(
            (fusers["users"] as any[]).map((fuser: any) => [
              fuser[0],
              {
                firstName: fuser[0],
                lastName: fuser[1],
                isOnline: false,
              },
            ])
          );
          for (let fonlineUserId of fusers["online_user_ids"] as number[]) {
            musers.get(fonlineUserId)!.isOnline = true;
          }
          setUsers(musers);
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
      sessionStorage.setItem("token", "");
    }
  }, [token]);

  const appState: AppState = useMemo(() => {
    const updateChatMessages = (chat: Chat, data: any) => {
      const messageEpoch = data["epoch"];
      const messages = "messages" in data ? data["messages"] : [data];
      let isModified = false;
      if (profile!.id === messages[0]["user_id"]) {
        const index = chatBot.pendingMessages.findIndex(
          ([pendingEpoch, _]) => pendingEpoch === messageEpoch
        );
        if (index !== -1) {
          chat.pendingMessages.splice(index, 1);
          isModified = true;
        }
      }
      if (!chat.until) {
        chat.messages = [];
        chat.until = new Date(messages[0]["timestamp"]);
        isModified = true;
      }
      for (let { user_id, message, timestamp } of messages) {
        if (message) {
          chat.messages!.push({
            userId: user_id,
            message: message,
            timestamp: new Date(timestamp),
          });
          isModified = true;
        }
      }
      return isModified;
    };

    const updateNotifications = (
      chatId: number,
      isRoom: boolean,
      data: any
    ) => {
      const { user_id, timestamp } = data;
      if (profile!.id === user_id) {
        let isChatInNotifications = false;
        for (let notification of notifications!) {
          if (
            notification.isRoom === isRoom &&
            notification.chatId === chatId
          ) {
            notification.isRead = false;
            isChatInNotifications = true;
            break;
          }
        }
        if (!isChatInNotifications) {
          notifications!.push({
            userId: user_id,
            chatId: chatId,
            isRoom: isRoom,
            isRead: false,
            timestamp: new Date(timestamp),
          });
        }
        setNotifications([...notifications!]);
      }
    };

    socketConnection.current?.addEventListener("message", (event) => {
      switch (event.data["type"]) {
        case "user_activity": {
          const { user_id, login } = event.data;
          const user = users.get(user_id)!;
          user.isOnline = login;
          setUsers(new Map(users));
          break;
        }
        case "user_update": {
          const { user_id, first_name, last_name } = event.data;
          let user = users.get(user_id);
          if (!user) {
            user = {
              firstName: first_name,
              lastName: last_name,
            };
            users.set(user_id, user);
          } else {
            user.firstName = first_name;
            user.lastName = last_name;
          }
          setUsers(new Map(users));
          break;
        }
        case "group_chat_update": {
          const { chat_group_id, name, owner_id } = event.data;
          let chatGroup = chatGroups.get(chat_group_id);
          if (!chatGroup) {
            chatGroup = {
              name: name,
              ownerId: owner_id,
              messages: undefined,
              until: undefined,
              pendingMessages: [],
            };
            chatGroups.set(chat_group_id, chatGroup);
          } else {
            chatGroup.name = name;
            chatGroup.ownerId = owner_id;
          }
          setChatGroups(new Map(chatGroups));
          break;
        }
        case "group_chat_message": {
          const { chat_group_id } = event.data;
          const chatGroup = chatGroups.get(chat_group_id)!;
          if (updateChatMessages(chatGroup, event.data)) {
            setChatGroups(new Map(chatGroups));
          }
          updateNotifications(chat_group_id, false, event.data);
          break;
        }
        case "room_chat_message": {
          const { user_id, other_user_id, chat_room_id } = event.data;
          const otherUserId = profile!.id === user_id ? other_user_id : user_id;
          let chatRoom = chatRooms.get(otherUserId);
          if (!chatRoom) {
            chatRoom = {
              chatRoomId: chat_room_id,
              messages: undefined,
              until: undefined,
              pendingMessages: [],
            };
            chatRooms.set(otherUserId, chatRoom);
          } else if (chatRoom.chatRoomId === 0) {
            chatRoom.chatRoomId = chat_room_id;
          }
          if (updateChatMessages(chatRoom, event.data)) {
            setChatRooms(new Map(chatRooms));
          }
          updateNotifications(chat_room_id, true, event.data);
          break;
        }
        case "bot_chat_message": {
          if (updateChatMessages(chatBot, event.data)) {
            setChatBot({ ...chatBot });
          }
          break;
        }
      }
    });

    const fetchMessages = (endpoint: string, chat: Chat, before: boolean) =>
      new Promise<void>((resolve, reject) => {
        sendRequest(
          "GET",
          endpoint,
          { timestamp: chat.until, before: before },
          (response: any) => {
            const messages = response as any[];
            for (let i = messages.length - 1; i >= 0; i--) {
              const [_, user_id, message, timestamp] = messages[i];
              chat.messages!.unshift({
                userId: user_id,
                message: message,
                timestamp: new Date(timestamp),
              });
            }
            resolve();
          },
          reject
        );
      });

    return {
      token,
      profile,
      users,
      notifications,
      userAccessRequests,
      chatGroups,
      chatRooms,
      chatBot,

      updateProfile: (update: User) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "PUT",
            "users/profile",
            {
              first_name: undefined || update.firstName,
              last_name: undefined || update.lastName,
              password: update.password,
            },
            (_: any) => {
              profile!.firstName ||= update.firstName;
              profile!.lastName ||= update.lastName;
              profile!.password ||= update.password;
              setProfile({ ...profile! });
              resolve();
            },
            reject
          )
        ),
      updateNotification: (chatId: number, isRoom: boolean) =>
        new Promise<void>((resolve, reject) => {
          sendRequest(
            "PUT",
            "notifications",
            { chat_id: chatId, is_room: isRoom },
            (_: any) => {
              for (let notification of notifications!) {
                if (
                  notification.isRoom === isRoom &&
                  notification.chatId === chatId
                ) {
                  if (!notification.isRead) {
                    notification.isRead = true;
                    setNotifications([...notifications!]);
                  }
                  break;
                }
              }
              resolve();
            },
            reject
          );
        }),
      registerChatGroup: (groupName: string) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "POST",
            "chat_groups",
            { name: groupName },
            resolve,
            reject
          )
        ),
      updateChatGroup: (newGroupName?: string, newOwnerId?: number) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "PUT",
            "chat_groups",
            { name: newGroupName, owner_id: newOwnerId },
            resolve,
            reject
          )
        ),
      registerChatGroupAccessRequest: (chatGroupId: number) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "POST",
            `chat_groups/access_requests/${chatGroupId}`,
            undefined,
            (response: any) => {
              userAccessRequests!.push({
                chatGroupId: chatGroupId,
                timestamp: new Date(response),
              });
              setUserAccessRequests([...userAccessRequests!]);
              resolve();
            },
            reject
          )
        ),
      reviewChatGroupAccessRequest: (
        chatGroupId: number,
        requesterId: number,
        access: boolean
      ) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "PUT",
            `chat_groups/access_requests/${chatGroupId}`,
            { requester_id: requesterId, access: access },
            resolve,
            reject
          )
        ),
      getGroupChatMessages: (chatGroupId: number, before: boolean) =>
        new Promise<void>((resolve, reject) => {
          const chatGroup = chatGroups.get(chatGroupId)!;
          fetchMessages(`chat_groups/${chatGroupId}`, chatGroup, before)
            .then(() => {
              setChatGroups(new Map(chatGroups));
              resolve();
            })
            .catch(reject);
        }),
      getRoomChatMessages: (chatRoomId: number, before: boolean) =>
        new Promise<void>((resolve, reject) => {
          const chatRoom = chatRooms.get(chatRoomId)!;
          fetchMessages(`chat_groups/${chatRoomId}`, chatRoom, before)
            .then(() => {
              setChatRooms(new Map(chatRooms));
              resolve();
            })
            .catch(reject);
        }),
      getBotChatMessages: (before: boolean) =>
        new Promise<void>((resolve, reject) => {
          fetchMessages("chat_bot", chatBot, before)
            .then(() => {
              setChatBot({ ...chatBot });
              resolve();
            })
            .catch(reject);
        }),
      sendMessage: (socketMessage: SocketMessage) => {
        if (token && socketMessage.message) {
          const epoch = +new Date();
          socketConnection.current?.send(
            JSON.stringify({
              ...socketMessage,
              token: token,
              epoch: epoch,
            })
          );
          switch (socketMessage.chatType) {
            case "group": {
              const chatGroup = chatGroups.get(socketMessage.chat_group_id!)!;
              chatGroup.pendingMessages.push([epoch, socketMessage.message]);
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
              chatRoom.pendingMessages.push([epoch, socketMessage.message]);
              setChatRooms(new Map(chatRooms));
              break;
            }
            default: {
              chatBot.pendingMessages.push([epoch, socketMessage.message]);
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
