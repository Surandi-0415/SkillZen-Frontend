import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Setup from "./pages/Setup";
import Generating from "./pages/Generating";
import PreInterview from "./pages/PreInterview";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import History from "./pages/History";
function Router() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/generating" element={<Generating />} />
      <Route path="/pre-interview" element={<PreInterview />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/results" element={<Results />} />
      <Route path="/profile" element={<Profile />} />
      <Route
  path="/history"
  element={<History />}
/>
    </Routes>
  );
}

export default Router;