import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {

  const [activeTab, setActiveTab] =
    useState("expenses");

  const [expenses, setExpenses] =
    useState([]);

  const [profile, setProfile] =
    useState({});

  const [formData, setFormData] =
    useState({
      amount: "",
      category: "",
      description: "",
      date: "",
    });

  const token =
    localStorage.getItem("token");

  // FETCH EXPENSES
  const fetchExpenses = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/expenses",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setExpenses(response.data);

    } catch (error) {
      console.log(error);
    }

  };

  // FETCH PROFILE
  const fetchProfile = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/profile",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setProfile(response.data);

    } catch (error) {
      console.log(error);
    }

  };

  useEffect(() => {

    fetchExpenses();
    fetchProfile();

  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  // ADD EXPENSE
  const addExpense = async (e) => {

    e.preventDefault();

    try {

      await axios.post(
        "http://127.0.0.1:8000/expenses",
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert("Expense Added");

      setFormData({
        amount: "",
        category: "",
        description: "",
        date: "",
      });

      fetchExpenses();

    } catch (error) {
      console.log(error);
    }

  };

  // LOGOUT
  const logout = () => {

    localStorage.removeItem("token");

    window.location.href = "/";

  };

  // TOTAL
  const totalExpenses =
    expenses.reduce(
      (total, item) =>
        total + Number(item.amount),
      0
    );

  // ANALYTICS DATA
  const categoryData = [];

  expenses.forEach((item) => {

    const existing =
      categoryData.find(
        (c) =>
          c.name === item.category
      );

    if (existing) {
      existing.value += Number(
        item.amount
      );
    } else {
      categoryData.push({
        name: item.category,
        value: Number(item.amount),
      });
    }

  });

  const COLORS = [
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#ef4444",
  ];

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <h1 style={styles.logo}>
          ExpenseTracker
        </h1>

        <button
          style={styles.tabBtn}
          onClick={() =>
            setActiveTab("expenses")
          }
        >
          Expenses
        </button>

        <button
          style={styles.tabBtn}
          onClick={() =>
            setActiveTab("analytics")
          }
        >
          Analytics
        </button>

        <button
          style={styles.tabBtn}
          onClick={() =>
            setActiveTab("profile")
          }
        >
          Profile
        </button>

        <button
          style={styles.logoutBtn}
          onClick={logout}
        >
          Logout
        </button>

      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* EXPENSES */}
        {activeTab === "expenses" && (

          <div>

            <h1 style={styles.heading}>
              Expenses
            </h1>

            <form
              onSubmit={addExpense}
              style={styles.form}
            >

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                style={styles.input}
                required
              />

              <input
                type="text"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                style={styles.input}
                required
              />

              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                style={styles.input}
              />

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />

              <button
                type="submit"
                style={styles.addBtn}
              >
                Add Expense
              </button>

            </form>

            <h2>
              Total Expenses: ₹
              {totalExpenses}
            </h2>

            {expenses.map((item) => (

              <div
                key={item.id}
                style={styles.expenseCard}
              >

                <h3>
                  ₹{item.amount}
                </h3>

                <p>
                  {item.category}
                </p>

                <p>
                  {item.description}
                </p>

                <p>
                  {item.date}
                </p>

              </div>

            ))}

          </div>

        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (

          <div>

            <h1 style={styles.heading}>
              Analytics
            </h1>

            <div
              style={{
                width: "500px",
                height: "400px",
              }}
            >

              <ResponsiveContainer>

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={150}
                    label
                  >

                    {categoryData.map(
                      (
                        entry,
                        index
                      ) => (

                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        )}

        {/* PROFILE */}
        {activeTab === "profile" && (

          <div>

            <h1 style={styles.heading}>
              Profile
            </h1>

            <div style={styles.profileCard}>

              <h2>
                Username:
                {" "}
                {profile.username}
              </h2>

              <h2>
                Email:
                {" "}
                {profile.email}
              </h2>

              <h2>
                Total Expenses:
                {" "}
                {expenses.length}
              </h2>

              <h2>
                Total Spent:
                {" "}
                ₹{totalExpenses}
              </h2>

            </div>

          </div>

        )}

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

  sidebar: {
    width: "250px",
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRight:
      "1px solid rgba(255,255,255,0.1)",
  },

  logo: {
    color: "#8b5cf6",
    marginBottom: "40px",
  },

  tabBtn: {
    width: "100%",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "10px",
    border: "none",
    background:
      "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
  },

  logoutBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "40px",
    borderRadius: "10px",
    border: "none",
    background:
      "linear-gradient(to right,#ef4444,#dc2626)",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
  },

  main: {
    flex: 1,
    padding: "40px",
  },

  heading: {
    fontSize: "40px",
    marginBottom: "30px",
  },

  form: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: "20px",
    marginBottom: "30px",
  },

  input: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
  },

  addBtn: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    background:
      "linear-gradient(to right,#7c3aed,#4f46e5)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  expenseCard: {
    background:
      "rgba(255,255,255,0.08)",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  profileCard: {
    background:
      "rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "20px",
    width: "500px",
  },

};

export default Dashboard;