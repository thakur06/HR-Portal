import React, { useEffect, useState, useMemo } from 'react';
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { gql, useQuery } from '@apollo/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// GraphQL query
const GET_WEEKLY_ANALYTICS = gql`
  query weeklyShiftSummary {
    weeklyShiftSummary {
      averageHoursPerDay
      totalHoursPerEmployee  # <-- no subfields
      totalWeekHours
      uniqueUsers {
        count
      }
      period {
        start
        end
      }
    }
  }
`

export const Analytics = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const { loading, error, data ,refetch } = useQuery(GET_WEEKLY_ANALYTICS);

  const [chartData, setChartData] = useState({ days: [], avgHours: [] });
  const [staffChartData, setStaffChartData] = useState({ labels: [], datasets: [] });
  const [totalWeekHours, setTotalWeekHours] = useState(0);
  const [uniqueUserCount, setUniqueUserCount] = useState(0);
  const [period, setPeriod] = useState({ start: '', end: '' });

  useEffect(() => {
    if (role !== "manager") {
      navigate("/clock");
    }
  }, [role, navigate]);

  useEffect(() => {
    refetch();
    if (!loading && data) {
        
      const res = data.weeklyShiftSummary;
        console.log(res)
      const days = Object.keys(res.averageHoursPerDay || {}).map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });
      const avgHours = Object.values(res.averageHoursPerDay || {});

      setChartData({ days, avgHours });

      const employees = Object.values(res.totalHoursPerEmployee || {});
      const staffNames = employees.map(staff => staff.name);
      const staffHours = employees.map(staff => staff.hours);

      setStaffChartData({
        labels: staffNames,
        datasets: [{
          label: "Total Hours Worked",
          data: staffHours,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }]
      });

      setTotalWeekHours(res.totalWeekHours || 0);
      setUniqueUserCount(res.uniqueUsers?.count || 0);
      setPeriod({
        start: res.period?.start || '',
        end: res.period?.end || ''
      });
    }
  }, [loading, data]);

  // Memoize the line chart data configuration to avoid unnecessary recalculation
  const lineChartDataConfig = useMemo(() => ({
    labels: chartData.days,
    datasets: [
      {
        label: "Avg Hours Per Day",
        data: chartData.avgHours,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        fill: false
      }
    ]
  }), [chartData]);

  // Memoize the line chart options to avoid unnecessary recalculation
  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Daily Average Hours (${period.start} to ${period.end})`,
        font: { size: 16, weight: "bold" }
      },
      legend: {
        position: "bottom",
        labels: { font: { size: 14 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}h`
        }
      }
    },
    scales: {
      x: {
        ticks: { font: { size: 14 } },
        title: { display: true, text: 'Days' }
      },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { font: { size: 14 } },
        title: { display: true, text: 'Hours' }
      }
    }
  }), [period]);

  // Memoize the bar chart options to avoid unnecessary recalculation
  const barChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Total Hours per Staff (${period.start} to ${period.end})`,
        font: { size: 16, weight: "bold" }
      },
      legend: {
        position: "bottom",
        labels: { font: { size: 14 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}h`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45
        },
        title: { display: true, text: 'Staff' }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { font: { size: 14 } },
        title: { display: true, text: 'Hours' }
      }
    }
  }), [period]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        <p>Error loading analytics data</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-2xl font-semibold text-gray-700 mb-6">ClockIn Statistics for Previous Week</h3>

    {/* Summary Tiles */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-100 text-blue-800 p-4 rounded-lg shadow-sm">
        <div className="text-sm font-medium">Total Hours Worked</div>
        <div className="text-2xl font-bold">{totalWeekHours}h</div>
      </div>

      <div className="bg-green-100 text-green-800 p-4 rounded-lg shadow-sm">
        <div className="text-sm font-medium">Total Logged In Users</div>
        <div className="text-2xl font-bold">{uniqueUserCount}</div>
      </div>

      <div className="col-span-1 sm:col-span-2 text-sm text-gray-500 mt-2 text-center">
        Period: {period.start} to {period.end}
      </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="p-4 bg-gray-100 rounded-lg h-[400px]">
        <Line data={lineChartDataConfig} options={lineChartOptions} />
      </div>
      <div className="p-4 bg-gray-100 rounded-lg h-[400px]">
        <Bar data={staffChartData} options={barChartOptions} />
      </div>
    </div>
  </div>
  );
};
