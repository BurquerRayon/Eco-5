import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const DashboardChart = ({ data, label }) => {
  const chartData = {
    labels: data.map(d => d.fecha),
    datasets: [
      {
        label: label,
        data: data.map(d => d.valor),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <Line data={chartData} />
    </div>
  );
};

export default DashboardChart;
