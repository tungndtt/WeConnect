import { createContext, useContext} from "react";
import User from "../types/user";

type AppState = {
  token: string;
  sendRequest: (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    payload?: any
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (information: User) => Promise<void>;
};

export const AppContext = createContext<AppState>({
  token: "",
  sendRequest: (
    _endpoint: string,
    _method: "GET" | "POST" | "PUT" | "DELETE",
    _payload?: any
  ) => new Promise(() => {}),
  signIn: (_email: string, _password: string) => new Promise<void>(() => {}),
  signOut: () => {},
  signUp: (_information: User) => new Promise<void>(() => {}),
});

export default function useAppContext() {
  return useContext(AppContext);
}
