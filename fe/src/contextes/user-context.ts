import { createContext, useContext } from "react";
import User from "../types/user";

export type UserMap = { [userId: number]: User };

type UserState = {
  users: UserMap;
};

export const UserContext = createContext<UserState>({
  users: {},
});

export default function useUserContext() {
  return useContext(UserContext);
};