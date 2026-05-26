import { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8000/reset-password", {
        username,
        new_password: newPassword,
      });

      alert("Password Updated Successfully");
    } catch (err) {
      alert("Password Reset Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center mb-6">
          Reset Password
        </h1>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border p-3 rounded-lg"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="New Password"
            className="w-full border p-3 rounded-lg"
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button className="w-full bg-black text-white p-3 rounded-lg">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;