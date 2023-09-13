import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../contextes/app-context";
import { UserContext, UserMap } from "../contextes/user-context";
import { addSocketMessageHandler } from "../lib/api/socket";

export default function UserProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const [users, setUsers] = useState<UserMap>({});

  useEffect(() => {
    if (token) {
      addSocketMessageHandler("user_activity", (data) => {
        const { user_id, login } = data;
        setUsers((_users: UserMap) => ({
          ..._users,
          [user_id]: { ..._users[user_id], isOnline: login },
        }));
      });
      addSocketMessageHandler("user_update", (data) => {
        const { user_id, first_name, last_name } = data;
        setUsers((_users: UserMap) => ({
          ..._users,
          [user_id]: {
            ..._users[user_id],
            firstName: first_name,
            lastName: last_name,
          },
        }));
      });
      sendRequest("users", "GET").then((_users) => {
        const _usersMap = {} as UserMap;
        (_users["users"] as any[]).forEach((_user: any) => {
          _users[_user[0]] = {
            id: _user[0],
            firstName: _user[1],
            lastName: _user[2],
            isOnline: false,
          };
        });
        for (let _onlineUserId of _users["online_user_ids"] as number[]) {
          _users[_onlineUserId]!.isOnline = true;
        }
        setUsers(_usersMap);
      });
    }
  }, [token]);

  return (
    <UserContext.Provider value={{ users }}>
      {props.children}
    </UserContext.Provider>
  );
}
