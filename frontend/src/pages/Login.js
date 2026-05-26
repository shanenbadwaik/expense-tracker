import { useState } from "react";
import axios from "axios";

function Login() {

  const [isRegister, setIsRegister] =
    useState(false);

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

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // REGISTER
      if (isRegister) {

        await axios.post(
          "http://127.0.0.1:8000/register",
          {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }
        );

        alert(
          "Registration Successful. Please Login."
        );

        setIsRegister(false);

        setFormData({
          username: "",
          email: "",
          password: "",
        });

      }

      // LOGIN
      else {

        const loginData = new URLSearchParams();

        loginData.append(
          "username",
          formData.email
        );

        loginData.append(
          "password",
          formData.password
        );

        const response = await axios.post(
          "http://127.0.0.1:8000/login",
          loginData,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );

        localStorage.setItem(
          "token",
          response.data.access_token
        );

        alert("Login Successful");

        window.location.href = "/dashboard";

      }

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.detail ||
        "Something went wrong"
      );

    }

  };

  return (

    <div style={styles.container}>

      {/* LEFT SECTION */}
      <div style={styles.left}>

        <h1 style={styles.logo}>
          ExpenseTracker
        </h1>

        <h2 style={styles.heading}>
          Manage Your Expenses Smartly
        </h2>

        <p style={styles.text}>
          Track your spending, monitor your
          savings, and stay financially strong
          with a modern expense tracking
          experience.
        </p>

      </div>

      {/* RIGHT SECTION */}
      <div style={styles.right}>

        <div style={styles.card}>

          <h1 style={styles.title}>
            {isRegister
              ? "Create Account"
              : "Welcome Back"}
          </h1>

          <p style={styles.subTitle}>
            {isRegister
              ? "Register to continue"
              : "Login to continue"}
          </p>

          <form onSubmit={handleSubmit}>

            {isRegister && (

              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                style={styles.input}
                required
              />

            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <button
              type="submit"
              style={styles.button}
            >
              {isRegister
                ? "Register"
                : "Login"}
            </button>

          </form>

          <p style={styles.switchText}>

            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}

            <span
              onClick={() =>
                setIsRegister(!isRegister)
              }
              style={styles.switchBtn}
            >
              {isRegister
                ? " Login"
                : " Register"}
            </span>

          </p>

        </div>

      </div>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    minHeight: "100vh",
    background:
      "linear-gradient(to right, #020024, #090979, #000000)",
    color: "white",
    fontFamily: "Arial",
  },

  left: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "80px",
  },

  logo: {
    color: "#8b5cf6",
    fontSize: "45px",
    marginBottom: "20px",
  },

  heading: {
    fontSize: "55px",
    lineHeight: "70px",
    marginBottom: "20px",
  },

  text: {
    color: "#d1d5db",
    fontSize: "20px",
    width: "80%",
    lineHeight: "35px",
  },

  right: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "420px",
    padding: "40px",
    borderRadius: "25px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0px 0px 30px rgba(0,0,0,0.4)",
  },

  title: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  subTitle: {
    color: "#d1d5db",
    marginBottom: "30px",
  },

  input: {
    width: "95%",
    padding: "10px",
    marginBottom: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    outline: "none",
    fontSize: "16px",
  },

  button: {
    width: "100%",
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background:
      "linear-gradient(to right, #7c3aed, #4f46e5)",
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },

  switchText: {
    marginTop: "25px",
    textAlign: "center",
    color: "#d1d5db",
  },

  switchBtn: {
    color: "#8b5cf6",
    cursor: "pointer",
    fontWeight: "bold",
  },

};

export default Login;