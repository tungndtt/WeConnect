import { ReactNode, useState, useEffect } from "react";
import { AppContext } from "../contextes/app-context";
import { establishSocketConnnection } from "../lib/api/socket";
import doRequest from "../lib/api/http";
import User from "../types/user";

export default function AppProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState(sessionStorage.getItem("token") || "");

  const sendRequest = (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    payload?: any
  ) => {
    return new Promise<any>((resolve, reject) => {
      doRequest(endpoint, {
        method,
        headers: { Authorization: token },
        payload,
      })
        .then(({ status, data }: any) => {
          if (status) resolve(data);
          else reject();
        })
        .catch(() => {
          setToken("");
          reject();
        });
    });
  };

  const signIn = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      sendRequest("login", "POST", { email, password })
        .then((response: any) => {
          setToken(response["token"]);
          resolve();
        })
        .catch(reject);
    });
  };

  const signOut = () => {
    return new Promise<void>((resolve, reject) => {
      sendRequest("logout", "GET")
        .then(() => {
          setToken("");
          resolve();
        })
        .catch(reject);
    });
  };

  const signUp = (information: User) => {
    return sendRequest("register", "POST", {
      email: information.email,
      password: information.password,
      first_name: information.firstName,
      last_name: information.lastName,
    });
  };

  useEffect(() => {
    if (token) {
      const socketConnection = establishSocketConnnection();
      socketConnection.addEventListener("open", () => {
        console.log("Connected to server");
        socketConnection.send(JSON.stringify({ token: token }));
      });
      socketConnection.addEventListener("close", () => {
        console.log("Disconnected to server");
        socketConnection.close();
        setToken("");
      });
    } else {
      sessionStorage.setItem("token", "");
    }
  }, [token]);

  return (
    <AppContext.Provider
      value={{ token, sendRequest, signIn, signOut, signUp }}
    >
      {props.children}
    </AppContext.Provider>
  );
}
