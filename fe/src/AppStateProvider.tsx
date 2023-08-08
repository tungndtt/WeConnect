import {
  ReactNode,
  MutableRefObject,
  createContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";

interface Message {
  userId: number;
  message: string;
  timestamp: Date;
}

interface Notification {
  isRead: boolean;
  chatRoomId: number;
  timestamp: Date;
}

interface User {
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
}

interface ChatGroup {
  name: string;
  groupOwnerId: number;
}

interface AppState {
  profile: User | undefined;
  usersInformation: User[] | undefined;
  notifications: Map<number, Notification>;
  chatGroups: Map<number, ChatGroup>;
  groupChatMessages: Map<number, Message[]>;
  roomChatMessages: Map<number, Message[]>;
  botChatMessages: Message[] | undefined;

  updateProfile: (update: User) => void;
  updateNotification: (userId: number) => void;
  getGroupChatMessages: (chatGroupId: number, pastScrolling: boolean) => void;
  informUserActivityInChatGroup: (
    chatGroupId: number,
    isEnter: boolean
  ) => void;
  getRoomChatMessages: (chatRoomId: number, pastScrolling: boolean) => void;
  getBotChatMessages: (pastScrolling: boolean) => void;
  sendMessage: (message: any) => void;
  signIn: (email: string, password: string) => void;
  signOut: () => void;
  signUp: (information: User) => void;
}

export const AppStateContext = createContext<AppState>({
  profile: undefined,
  usersInformation: undefined,
  notifications: new Map<number, Notification>(),
  chatGroups: new Map<number, ChatGroup>(),
  groupChatMessages: new Map<number, Message[]>(),
  roomChatMessages: new Map<number, Message[]>(),
  botChatMessages: undefined,

  updateProfile: (_update: User) => {},
  updateNotification: (_userId: number) => {},
  informUserActivityInChatGroup: (
    _chatGroupId: number,
    _isEnter: boolean
  ) => {},
  getGroupChatMessages: (_chatGroupId: number, _pastScrolling: boolean) => {},
  getRoomChatMessages: (_chatRoomId: number, _pastScrolling: boolean) => {},
  getBotChatMessages: (_pastScrolling: boolean) => {},
  sendMessage: (_message: any) => {},
  signIn: (_email: string, _password: string) => {},
  signOut: () => {},
  signUp: (_information: User) => {},
});

const HOST = "127.0.0.1";
const PORT = 2204;

export function AppStateProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const socketConnection = useRef(undefined as WebSocket | undefined);

  const [profile, setProfile] = useState(undefined as User | undefined);
  const [usersInformation, setUsersInformation] = useState(
    undefined as User[] | undefined
  );
  const [notifications, setNotifications] = useState(
    new Map<number, Notification>()
  );
  const [chatGroups, setChatGroups] = useState(new Map<number, ChatGroup>());

  const [botChatMessages, setBotChatMessages] = useState([] as Message[]);
  const botChatTimestamp = useRef(undefined as Date | undefined);

  const [roomChatMessages, setRoomChatMessages] = useState(
    new Map<number, Message[]>()
  );
  const roomChatTimestamps = useRef(new Map<number, Date>());

  const [groupChatMessages, setGroupChatMessages] = useState(
    new Map<number, Message[]>()
  );
  const groupChatTimestamps = useRef(new Map<number, [Date, Date]>());

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
      botChatTimestamp.current = new Date(
        sessionStorage.get("botchat_timestamp")
      );
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) as string;
        const timestamp = sessionStorage.getItem(key) as string;
        if (key.startsWith("room-")) {
          const roomId = Number(key.substring("room-".length));
          roomChatTimestamps.current.set(roomId, new Date(timestamp));
        }
        if (key.startsWith("group-")) {
          const groupId = Number(key.substring("group-".length));
          groupChatTimestamps.current.set(groupId, [
            new Date(timestamp),
            new Date(timestamp),
          ]);
        }
      }
      socketConnection.current = new WebSocket(`ws://${HOST}:${PORT}/socket`);
      socketConnection.current?.addEventListener("open", () => {
        console.log("Connected to server");
        socketConnection.current?.send(JSON.stringify({ token: token }));
      });

      socketConnection.current?.addEventListener("message", (event) => {
        const type = event.data["type"];
        switch (type) {
          case "user_activity": {
            break;
          }
          case "bot_chat_message": {
            break;
          }
          case "room_chat_message": {
            break;
          }
          case "group_chat_message": {
            break;
          }
          case "group_chat_activitity": {
            break;
          }
        }
      });

      socketConnection.current?.addEventListener("close", () => {
        console.log("Disconnected to server");
        socketConnection.current?.close();
        setToken("");
      });
    } else {
      botChatTimestamp.current = undefined;
      roomChatTimestamps.current.clear();
      groupChatTimestamps.current.clear();
      socketConnection.current = undefined;
    }
  }, [token]);

  const appState: AppState = useMemo(
    () => ({
      profile,
      usersInformation,
      notifications,
      chatGroups,
      groupChatMessages,
      roomChatMessages,
      botChatMessages,

      updateProfile: (update: User) => {},
      updateNotification: (userId: number) => {},
      informUserActivityInChatGroup: (
        chatGroupId: number,
        isEnter: boolean
      ) => {},
      getGroupChatMessages: (chatGroupId: number, pastScrolling: boolean) => {},
      getRoomChatMessages: (chatRoomId: number, pastScrolling: boolean) => {},
      getBotChatMessages: (pastScrolling: boolean) => {},
      sendMessage: (message: any) => {
        if (token) {
          socketConnection.current?.send(
            JSON.stringify({ ...message, token: token })
          );
        }
      },
      signIn: (email: string, password: string) =>
        sendRequest(
          "POST",
          "/login",
          { email, password },
          (response) => setToken(response["token"]),
          (_) => console.log("")
        ),
      signOut: () =>
        sendRequest(
          "GET",
          "/logout",
          undefined,
          (_) => setToken(""),
          (_) => console.log("")
        ),
      signUp: (information: User) => {},
    }),
    [
      profile,
      usersInformation,
      notifications,
      chatGroups,
      groupChatMessages,
      roomChatMessages,
      botChatMessages,
    ]
  );

  return (
    <AppStateContext.Provider value={appState}>
      {props.children}
    </AppStateContext.Provider>
  );
}
