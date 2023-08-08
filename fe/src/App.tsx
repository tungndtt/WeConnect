import { AppStateProvider } from "./AppStateProvider";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <AppStateProvider>
      <Routes>
        <Route />
      </Routes>
    </AppStateProvider>
  );
}

export default App;
