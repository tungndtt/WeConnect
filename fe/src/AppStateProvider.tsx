import {
  ReactNode,
  createContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  isOnline?: boolean;
};
type Notification = {
  userId: number;
  chatId: number;
  isRoom: boolean;
  isRead: boolean;
  timestamp: Date;
};
type UserAccessRequest = {
  chatGroupId: number;
  timestamp: Date;
};
type Message = {
  userId: number;
  message: string;
  timestamp: Date;
};
type Chat = {
  until?: Date;
  messages: Message[] | undefined;
  pendingMessages: [number, string][];
};
type ChatGroup = Chat & {
  name: string;
  ownerId: number;
};
type ChatRoom = Chat & {
  chatRoomId: number;
};
type UserMap = { [userId: number]: User };
type ChatGroupMap = { [chatGroupId: number]: ChatGroup };
type ChatRoomMap = { [userId: number]: ChatRoom };
type SocketMessage = {
  chatType: "group" | "room" | "bot";
  message: string;
  other_user_id?: number;
  chat_group_id?: number;
};
type AppState = {
  token: string;
  profile: User | undefined;
  users: UserMap;
  notifications: Notification[];
  userAccessRequests: UserAccessRequest[];
  chatGroups: ChatGroupMap;
  chatRooms: ChatRoomMap;
  chatBot: Chat;

  getUserNameAbbreviation: (userId: number) => string;

  updateProfile: (update: User) => Promise<void>;
  updateNotification: (chatId: number, isRoom: boolean) => Promise<void>;
  registerChatGroup: (groupName: string) => Promise<void>;
  updateChatGroup: (
    chatGroupId: number,
    newGroupName?: string,
    newOwnerId?: number
  ) => Promise<void>;
  registerChatGroupAccessRequest: (chatGroupId: number) => Promise<void>;
  reviewChatGroupAccessRequest: (
    chatGroupId: number,
    requesterId: number,
    acess: boolean
  ) => Promise<void>;
  ungregisterChatGroupAccessRequest: (
    chatGroupId: number,
    userId: number
  ) => Promise<void>;
  getGroupChatMessages: (chatGroupId: number, before: boolean) => Promise<void>;
  getRoomChatMessages: (chatRoomId: number, before: boolean) => Promise<void>;
  getBotChatMessages: (before: boolean) => Promise<void>;
  sendMessage: (message: SocketMessage) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (information: User) => Promise<void>;
};

export const AppStateContext = createContext<AppState>({
  token: "",
  profile: undefined,
  users: {},
  notifications: [],
  userAccessRequests: [],
  chatGroups: {},
  chatRooms: {},
  chatBot: {
    until: undefined,
    messages: undefined,
    pendingMessages: [] as [number, string][],
  },

  getUserNameAbbreviation: (_userId: number) => "",

  updateProfile: (_update: User) => new Promise<void>(() => {}),
  updateNotification: (_chatId: number, _isRoom: boolean) =>
    new Promise<void>(() => {}),
  registerChatGroup: (_groupName: string) => new Promise<void>(() => {}),
  updateChatGroup: (
    _chatGroupId: number,
    _newGroupName?: string,
    _newOwnerId?: number
  ) => new Promise<void>(() => {}),
  registerChatGroupAccessRequest: (_chatGroupId: number) =>
    new Promise<void>(() => {}),
  reviewChatGroupAccessRequest: (
    _chatGroupId: number,
    _requesterId: number,
    _access: boolean
  ) => new Promise<void>(() => {}),
  ungregisterChatGroupAccessRequest: (_chatGroupId: number, _userId: number) =>
    new Promise<void>(() => {}),
  getGroupChatMessages: (_chatGroupId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  getRoomChatMessages: (_chatRoomId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  getBotChatMessages: (_before: boolean) => new Promise<void>(() => {}),
  sendMessage: (_message: SocketMessage) => {},
  signIn: (_email: string, _password: string) => new Promise<void>(() => {}),
  signOut: () => {},
  signUp: (_information: User) => new Promise<void>(() => {}),
});

const HOST = "127.0.0.1";
const PORT = 2204;

export function AppStateProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState(sessionStorage.getItem("token") || "");
  const socketConnection = useRef<WebSocket | undefined>(undefined);

  const [profile, setProfile] = useState<User | undefined>(undefined);
  const [users, setUsers] = useState<UserMap>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userAccessRequests, setUserAccessRequests] = useState<
    UserAccessRequest[]
  >([]);

  const [chatGroups, setChatGroups] = useState<ChatGroupMap>({});
  const [chatRooms, setChatRooms] = useState<ChatRoomMap>({});
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
      const roomChatTimestamps = {} as { [chatRoomId: number]: Date };
      const groupChatTimestamps = {} as { [chatGroupId: number]: Date };
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) as string;
        const timestamp = sessionStorage.getItem(key) as string;
        if (key.startsWith("roomchat_timestamp-")) {
          const roomId = Number(key.substring("roomchat_timestamp-".length));
          roomChatTimestamps[roomId] = new Date(timestamp);
        } else if (key.startsWith("groupchat_timestamp-")) {
          const groupId = Number(key.substring("groupchat_timestamp-".length));
          groupChatTimestamps[groupId] = new Date(timestamp);
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
      socketConnection.current?.addEventListener("message", (event) => {
        const updateChatMessages = (chat: Chat, data: any) => {
          const messageEpoch = data["epoch"];
          const messages = "messages" in data ? data["messages"] : [data];
          let isModified = false;
          if (profile!.id === messages[0]["user_id"]) {
            const index = chat.pendingMessages.findIndex(
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

        switch (event.data["type"]) {
          case "user_activity": {
            const { user_id, login } = event.data;
            setUsers((_users: UserMap) => ({
              ..._users,
              [user_id]: { ..._users[user_id], isOnline: login },
            }));
            break;
          }
          case "user_update": {
            const { user_id, first_name, last_name } = event.data;
            setUsers((_users: UserMap) => ({
              ..._users,
              [user_id]: {
                ..._users[user_id],
                firstName: first_name,
                lastName: last_name,
              },
            }));
            break;
          }
          case "group_chat_update": {
            const { chat_group_id, name, owner_id } = event.data;
            setChatGroups((_chatGroups: ChatGroupMap) => ({
              ..._chatGroups,
              [chat_group_id]: {
                ..._chatGroups[chat_group_id],
                ownerId: owner_id,
                name: name,
              },
            }));
            break;
          }
          case "unregister_access_request": {
            const { chat_group_id, is_leave } = event.data;
            delete chatGroups[chat_group_id];
            setChatGroups({ ...chatGroups });
            if (is_leave) {
              setNotifications((_notifications: Notification[]) => {
                const index = _notifications!.findIndex(
                  (notification: Notification) =>
                    !notification.isRoom &&
                    notification.chatId === chat_group_id
                );
                _notifications!.splice(index, 1);
                return [..._notifications];
              });
            } else {
              setUserAccessRequests(
                (_userAccessRequests: UserAccessRequest[]) => {
                  const index = userAccessRequests!.findIndex(
                    (userAccessRequest: UserAccessRequest) =>
                      !userAccessRequest.chatGroupId === chat_group_id
                  );
                  _userAccessRequests!.splice(index, 1);
                  return [..._userAccessRequests];
                }
              );
            }
            break;
          }
          case "group_chat_message": {
            const { chat_group_id } = event.data;
            setChatGroups((_chatGroups: ChatGroupMap) => {
              const _chatGroup = _chatGroups[chat_group_id];
              return updateChatMessages(_chatGroup, event.data)
                ? { ..._chatGroups, [chat_group_id]: _chatGroup }
                : _chatGroups;
            });
            updateNotifications(chat_group_id, false, event.data);
            break;
          }
          case "room_chat_message": {
            const { user_id, other_user_id, chat_room_id } = event.data;
            setChatRooms((_chatRooms: ChatRoomMap) => {
              const otherUserId =
                profile!.id === user_id ? other_user_id : user_id;
              let _chatRoom = _chatRooms[otherUserId];
              if (!_chatRoom) {
                _chatRoom = {
                  chatRoomId: chat_room_id,
                  messages: undefined,
                  until: undefined,
                  pendingMessages: [],
                };
                _chatRooms[otherUserId] = _chatRoom;
              } else if (_chatRoom.chatRoomId === 0) {
                _chatRoom.chatRoomId = chat_room_id;
              }
              return updateChatMessages(_chatRoom, event.data)
                ? { ...chatRooms, [otherUserId]: _chatRoom }
                : _chatRooms;
            });
            updateNotifications(chat_room_id, true, event.data);
            break;
          }
          case "bot_chat_message": {
            if (updateChatMessages(chatBot, event.data)) {
              setChatBot((_chatBot: Chat) =>
                updateChatMessages(_chatBot, event.data)
                  ? { ..._chatBot }
                  : _chatBot
              );
            }
            break;
          }
        }
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
          const _users = {} as UserMap;
          (fusers["users"] as any[]).forEach((fuser: any) => {
            _users[fuser[0]] = {
              id: fuser[0],
              firstName: fuser[1],
              lastName: fuser[2],
              isOnline: false,
            };
          });
          for (let fonlineUserId of fusers["online_user_ids"] as number[]) {
            _users[fonlineUserId]!.isOnline = true;
          }
          setUsers(_users);
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
          const _chatGroups = {} as ChatGroupMap;
          (fchatGroups as any[]).forEach((fchatGroup: any) => {
            _chatGroups[fchatGroup[0]] = {
              name: fchatGroup[1],
              ownerId: fchatGroup[2],
              until: groupChatTimestamps[fchatGroup[0]],
              messages: undefined,
              pendingMessages: [],
            };
          });
          setChatGroups(_chatGroups);
          const _chatRooms = {} as ChatRoomMap;
          (fchatRooms as any[]).forEach((fchatRoom: any) => {
            _chatRooms[fchatRoom[1]] = {
              chatRoomId: fchatRoom[0],
              until: roomChatTimestamps[fchatRoom[0]],
              messages: undefined,
              pendingMessages: [],
            };
          });
          setChatRooms(_chatRooms);
        }
      );
    } else {
      socketConnection.current = undefined;
      sessionStorage.setItem("token", "");
    }

    return () => {
      sessionStorage.set("botchat_timestamp", chatBot.until?.toString());
      for (let [chatGroupId, chatGroup] of Object.entries(chatGroups)) {
        sessionStorage.set(
          `groupchat_timestamp-${chatGroupId}`,
          chatGroup.until?.toString()
        );
      }
      for (let [chatRoomId, chatRoom] of Object.entries(chatRooms)) {
        sessionStorage.set(
          `roomchat_timestamp-${chatRoomId}`,
          chatRoom.until?.toString()
        );
      }
    };
  }, [token]);

  const appState: AppState = useMemo(() => {
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

      getUserNameAbbreviation: (userId: number) => {
        const user = users[userId];
        return user
          ? user.firstName.charAt(0).toUpperCase() +
              user.lastName.charAt(0).toUpperCase()
          : "";
      },

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
      updateChatGroup: (
        chatGroupId: number,
        newGroupName?: string,
        newOwnerId?: number
      ) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "PUT",
            `chat_groups/${chatGroupId}`,
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
      ungregisterChatGroupAccessRequest: (
        chatGroupId: number,
        userId: number
      ) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "DELETE",
            `chat_groups/access_requests/${chatGroupId}`,
            { user_id: userId },
            resolve,
            reject
          )
        ),
      getGroupChatMessages: (chatGroupId: number, before: boolean) =>
        new Promise<void>((resolve, reject) => {
          const chatGroup = chatGroups[chatGroupId];
          fetchMessages(`chat_groups/${chatGroupId}`, chatGroup, before)
            .then(() => {
              setChatGroups({ ...chatGroups, [chatGroupId]: chatGroup });
              resolve();
            })
            .catch(reject);
        }),
      getRoomChatMessages: (userId: number, before: boolean) =>
        new Promise<void>((resolve, reject) => {
          const chatRoom = chatRooms[userId];
          fetchMessages(`chat_rooms/${chatRoom.chatRoomId}`, chatRoom, before)
            .then(() => {
              setChatRooms({ ...chatRooms, [userId]: chatRoom });
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
              const chatGroup = chatGroups[socketMessage.chat_group_id!];
              chatGroup.pendingMessages.push([epoch, socketMessage.message]);
              setChatGroups({ ...chatGroups });
              break;
            }
            case "room": {
              let chatRoom = chatRooms[socketMessage.other_user_id!];
              if (!chatRoom) {
                chatRoom = {
                  chatRoomId: 0,
                  messages: undefined,
                  until: undefined,
                  pendingMessages: [],
                };
                chatRooms[socketMessage.other_user_id!] = chatRoom;
              }
              chatRoom.pendingMessages.push([epoch, socketMessage.message]);
              setChatRooms({ ...chatRooms });
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
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "POST",
            "login",
            { email, password },
            (response: any) => {
              setToken(response["token"]);
              resolve();
            },
            reject
          )
        ),
      signOut: () =>
        sendRequest(
          "GET",
          "logout",
          undefined,
          (_: any) => setToken(""),
          () => {}
        ),
      signUp: (information: User) =>
        new Promise<void>((resolve, reject) =>
          sendRequest(
            "POST",
            "register",
            {
              email: information.email,
              password: information.password,
              first_name: information.firstName,
              last_name: information.lastName,
            },
            (_: any) => {
              setToken("");
              resolve();
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
