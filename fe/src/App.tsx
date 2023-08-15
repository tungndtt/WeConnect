import { useContext } from "react";
import { AppStateProvider, AppStateContext } from "./AppStateProvider";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "./components/Header";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChatOptions from "./pages/ChatOptions";
import Profile from "./pages/Profile";
import GroupChat from "./pages/GroupChat";
import RoomChat from "./pages/RoomChat";
import BotChat from "./pages/BotChat";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route
        path="/chat_options"
        element={
          <PrivateRoute>
            <ChatOptions />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/group_chat/:groupId"
        element={
          <PrivateRoute>
            <GroupChat />
          </PrivateRoute>
        }
      />
      <Route
        path="/room_chat/:userId"
        element={
          <PrivateRoute>
            <RoomChat />
          </PrivateRoute>
        }
      />
      <Route
        path="/bot_chat"
        element={
          <PrivateRoute>
            <BotChat />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function PrivateRoute(props: { children: JSX.Element }) {
  const { token } = useContext(AppStateContext);

  return token ? (
    <AppStateProvider>
      <Header />
      {props.children}
    </AppStateProvider>
  ) : (
    <Navigate to="/" replace />
  );
}

export default App;
