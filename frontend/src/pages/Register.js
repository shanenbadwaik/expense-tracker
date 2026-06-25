import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/register`, formData);

      alert("Registration Successful");

      navigate("/");
    } catch (error) {
      alert(error.response?.data?.detail || "Registration Failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Register</h1>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "350px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    marginTop: "20px",
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};

export default Register;