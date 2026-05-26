import axios from "axios";

function ExpenseForm({ onAdd }) {
  const submit = async (e) => {
    e.preventDefault();

    const expense = {
      amount: Number(e.target.amount.value),
      category: e.target.category.value,
      date: e.target.date.value,
      description: e.target.description.value
    };

    await axios.post("http://localhost:8000/expenses", expense);
    alert("Expense Added");

    e.target.reset();
    onAdd(); // 🔥 refresh list
  };

  return (
    <form onSubmit={submit}>
      <input name="amount" placeholder="Amount" required />
      <input name="category" placeholder="Category" required />
      <input name="date" type="date" required />
      <input name="description" placeholder="Description" />
      <button type="submit">Add</button>
    </form>
  );
}

export default ExpenseForm;
