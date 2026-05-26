import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

function ExpenseChart() {
  const data = {
    labels: ["Food", "Travel", "Shopping"],
    datasets: [
      {
        label: "Expenses",
        data: [2000, 1500, 3000]
      }
    ]
  };

  return <Bar data={data} />;
}

export default ExpenseChart;
