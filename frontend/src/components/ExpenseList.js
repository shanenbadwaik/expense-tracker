function ExpenseList({ expenses }) {
  return (
    <div>
      <h3>Expense History</h3>
      <ul>
        {expenses.map(exp => (
          <li key={exp.id}>
            ₹{exp.amount} | {exp.category} | {exp.date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseList;
