import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import VerifyEmail    from "./pages/VerifyEmail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Login />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
