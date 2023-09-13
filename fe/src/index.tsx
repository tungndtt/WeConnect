import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
// import { AppStateProvider } from "./AppStateProvider";
import AppProvider from "./providers/AppProvider";
import ProfileProvider from "./providers/ProfileProvider";
import UserProvider from "./providers/UserProvider";
import NotificationProvider from "./providers/NotificationProvider";
import UserAccessRequestProvider from "./providers/UserAccessRequestProvider";
import ChatBotProvider from "./providers/chat/ChatBotProvider";
import ChatGroupProvider from "./providers/chat/ChatGroupProvider";
import ChatRoomProvider from "./providers/chat/ChatRoomProvider";
import "./index.css";
// import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <AppStateProvider>
  //   <BrowserRouter>
  //     <App />
  //   </BrowserRouter>
  // </AppStateProvider>
  <AppProvider>
    <ProfileProvider>
      <UserProvider>
        <NotificationProvider>
          <UserAccessRequestProvider>
            <ChatBotProvider>
              <ChatGroupProvider>
                <ChatRoomProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </ChatRoomProvider>
              </ChatGroupProvider>
            </ChatBotProvider>
          </UserAccessRequestProvider>
        </NotificationProvider>
      </UserProvider>
    </ProfileProvider>
  </AppProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
