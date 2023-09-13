import { useContext } from "react";
import { AppStateContext } from "./AppStateProvider";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "./components/Header";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChatOptions from "./pages/ChatOptions";
import Profile from "./pages/Profile";
import GroupChat from "./pages/GroupChat";
import RoomChat from "./pages/RoomChat";
import BotChat from "./pages/BotChat";
import { Box } from "@mui/material";

function App() {
  return (
    <>
      <Header />
      <Box width="100%" height="calc(100% - var(--header-height))">
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
      </Box>
    </>
  );
}

function PrivateRoute(props: { children: JSX.Element }) {
  const { token } = useContext(AppStateContext);
  return token ? props.children : <Navigate to="/" replace />;
}

export default App;
