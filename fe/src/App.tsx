import { AppStateProvider } from "./AppStateProvider";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChatOptions from "./pages/ChatOptions";
import Profile from "./pages/Profile";
import HumanChat from "./pages/HumanChat";
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
        path="/bot_chat"
        element={
          <PrivateRoute>
            <BotChat />
          </PrivateRoute>
        }
      />
      <Route
        path="/human_chat"
        element={
          <PrivateRoute>
            <HumanChat />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function PrivateRoute(props: { children: JSX.Element }) {
  const navigate = useNavigate();

  return true ? (
    <AppStateProvider>
      <Header />
      {props.children}
    </AppStateProvider>
  ) : (
    <Navigate to="/" replace />
  );
}

export default App;
